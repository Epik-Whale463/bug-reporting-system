from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action, api_view
from rest_framework.response import Response
from .models import Project, Issue, Comment, UserProfile
from django.db.models import Count, Q
from .serializers import ProjectSerializer, IssueSerializer, CommentSerializer, RegisterSerializer
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from django.shortcuts import get_object_or_404
from django.contrib.auth.models import User
from rest_framework import serializers
from django.db.models import Q

@api_view(['GET'])
def health_check(request):
    """Simple health check endpoint"""
    return Response({"status": "Backend is live", "message": "Bug Reporting System API is running!"})

class UserSerializer(serializers.ModelSerializer):
    role = serializers.CharField(source='profile.role', read_only=True)
    can_create_projects = serializers.BooleanField(source='profile.can_create_projects', read_only=True)
    can_delete_issues = serializers.BooleanField(source='profile.can_delete_issues', read_only=True)
    can_assign_issues = serializers.BooleanField(source='profile.can_assign_issues', read_only=True)
    
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'role', 'can_create_projects', 'can_delete_issues', 'can_assign_issues']

class IsOwnerOrReadOnly(permissions.BasePermission):
    """
    Custom permission to only allow owners of a project to edit it.
    Anyone can read (view) projects.
    """
    def has_object_permission(self, request, view, obj):
        # Read permissions for EVERYONE (including anonymous users)
        if request.method in permissions.SAFE_METHODS:
            return True
        # Write permissions only to the owner of the project
        return obj.owner == request.user

class IssueCreateOrReadPermission(permissions.BasePermission):
    """
    Custom permissions for issues:
    - Everyone can view and create issues in any project
    - Only project owners can update issue status and assignments
    - Issue reporters can update their own issue details (title, description)
    """
    def has_permission(self, request, view):
        # Allow read and create for everyone (authenticated users)
        if request.method in permissions.SAFE_METHODS:
            return True
        if request.method == 'POST':
            return request.user.is_authenticated
        # For PUT/PATCH/DELETE, check object-level permissions
        return request.user.is_authenticated
    
    def has_object_permission(self, request, view, obj):
        # Read permissions for EVERYONE
        if request.method in permissions.SAFE_METHODS:
            return True
        
        user = request.user
        if not user.is_authenticated:
            return False
        
        # DELETE - only project owner
        if request.method == 'DELETE':
            return obj.project.owner == user
        
        # For PUT/PATCH - check what's being updated
        if request.method in ['PUT', 'PATCH']:
            # Check if trying to update status or assignee - only project owner can do this
            request_data = getattr(request, 'data', {})
            if 'status' in request_data or 'assignee' in request_data or 'assignee_id' in request_data:
                return obj.project.owner == user
            
            # Otherwise, allow reporter to update their own issue details
            return obj.reporter == user or obj.project.owner == user
        
        return False

class CanCreateProjects(permissions.BasePermission):
    """
    Permission to check if user can create projects based on their role
    """
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        
        if not request.user.is_authenticated:
            return False
            
        if request.method == 'POST':
            profile = getattr(request.user, 'profile', None)
            if not profile:
                return False
            return profile.can_create_projects or profile.is_admin
        
        return True

class CanDeleteIssues(permissions.BasePermission):
    """
    Permission to check if user can delete issues
    """
    def has_object_permission(self, request, view, obj):
        if request.method != 'DELETE':
            return True
            
        if not request.user.is_authenticated:
            return False
            
        profile = getattr(request.user, 'profile', None)
        if not profile:
            return False
            
        # Admin can delete any issue
        if profile.is_admin:
            return True
            
        # Project owner can delete issues in their projects
        if obj.project.owner == request.user:
            return True
            
        # Users with delete permission can delete their own reported issues
        if profile.can_delete_issues and obj.reporter == request.user:
            return True
        
        return False

class CanAssignIssues(permissions.BasePermission):
    """
    Permission to check if user can assign issues
    """
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
            
        # Check if trying to assign/reassign issue
        if 'assignee' in request.data or 'assignee_id' in request.data:
            profile = getattr(request.user, 'profile', None)
            if not profile:
                return False
                
            # Admin can assign any issue
            return profile.is_admin or profile.can_assign_issues or profile.can_manage_all_projects
        
        return True

class ProjectViewSet(viewsets.ModelViewSet):
    serializer_class = ProjectSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly, IsOwnerOrReadOnly]
    # Enable pagination for projects (uses default pagination)
    # To customize, import and set a pagination class here
    pagination_class = None  # Remove this line to use default pagination

    def get_queryset(self):
        # Return ALL projects for everyone to see (public projects)
        queryset = Project.objects.all().annotate(
            issue_count=Count('issues'),
            open_issues=Count('issues', filter=Q(issues__status='open')),
            in_progress_issues=Count('issues', filter=Q(issues__status='in_progress')),
            closed_issues=Count('issues', filter=Q(issues__status='closed')),
        ).order_by('-created_at')
        
        return queryset

    def perform_create(self, serializer):
        # Automatically set the owner to the current user when creating
        serializer.save(owner=self.request.user)

class IssueViewSet(viewsets.ModelViewSet):
    serializer_class = IssueSerializer
    permission_classes = [IssueCreateOrReadPermission]

    def get_queryset(self):
        # Return ALL issues for everyone to see (public dashboard)
        queryset = Issue.objects.select_related('project','reporter','assignee').all().order_by('-created_at')
        
        project_id = self.kwargs.get('project_pk')
        
        if project_id:
            # Protect against non-integer project ids (e.g., 'undefined') coming from the frontend
            try:
                project_id_int = int(project_id)
            except (TypeError, ValueError):
                # Return empty queryset instead of raising 500
                return queryset.none()

            queryset = queryset.filter(project_id=project_id_int)
        
        # Search functionality
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(
                Q(title__icontains=search) | Q(description__icontains=search)
            )
        
        # Filter by status and priority
        status_filter = self.request.query_params.get('status', None)
        if status_filter:
            queryset = queryset.filter(status=status_filter)
            
        priority_filter = self.request.query_params.get('priority', None)
        if priority_filter:
            queryset = queryset.filter(priority=priority_filter)
        
        return queryset

    def perform_create(self, serializer):
        # Handle nested creation under projects (POST /projects/<id>/issues/)
        project_id = self.kwargs.get('project_pk')
        if project_id:
            # Just ensure the project exists (no ownership check for creation)
            project = get_object_or_404(Project, pk=project_id)
            serializer.save(project=project, reporter=self.request.user)
        else:
            # Handle top-level creation if project is provided in data
            serializer.save(reporter=self.request.user)

    def perform_update(self, serializer):
        # Permission checks are handled in IssueCreateOrReadPermission
        # Just save the update
        serializer.save()

    def get_permissions(self):
        # Use our new permission class for all actions
        return [IssueCreateOrReadPermission()]

class CommentViewSet(viewsets.ModelViewSet):
    serializer_class = CommentSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        # Return ALL comments for everyone to see (public dashboard)
        queryset = Comment.objects.select_related('issue','author').prefetch_related('replies__author').all().order_by('created_at')
        
        issue_id = self.kwargs.get('issue_pk')
        if issue_id:
            queryset = queryset.filter(issue_id=issue_id)
        
        # Only return top-level comments (no parent) for the main list
        # Replies are included via the serializer
        return queryset.filter(parent_comment__isnull=True)

    def perform_create(self, serializer):
        issue_id = self.kwargs.get('issue_pk')
        # Just ensure the issue exists (no ownership check)
        issue = get_object_or_404(Issue, pk=issue_id)
        
        # Check if this is a reply to another comment
        parent_comment_id = self.request.data.get('parent_comment')
        parent_comment = None
        if parent_comment_id:
            parent_comment = get_object_or_404(Comment, pk=parent_comment_id, issue=issue)
        
        serializer.save(issue=issue, author=self.request.user, parent_comment=parent_comment)


class UserViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = User.objects.select_related('profile').all()
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    @action(detail=True, methods=['patch'], permission_classes=[permissions.IsAuthenticated])
    def update_role(self, request, pk=None):
        """Update user role - admin only"""
        user = self.get_object()
        profile = getattr(request.user, 'profile', None)
        
        if not profile or not profile.is_admin:
            return Response(
                {'error': 'Only administrators can update user roles'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        user_profile = getattr(user, 'profile', None)
        if not user_profile:
            return Response(
                {'error': 'User profile not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Update role and permissions
        role = request.data.get('role')
        if role and role in dict(UserProfile.ROLE_CHOICES):
            user_profile.role = role
            
            # Auto-set permissions based on role
            if role == 'admin':
                user_profile.can_create_projects = True
                user_profile.can_delete_issues = True
                user_profile.can_assign_issues = True
            elif role == 'project_manager':
                user_profile.can_create_projects = True
                user_profile.can_delete_issues = True
                user_profile.can_assign_issues = True
            elif role == 'developer':
                user_profile.can_create_projects = True
                user_profile.can_delete_issues = False
                user_profile.can_assign_issues = False
            elif role == 'tester':
                user_profile.can_create_projects = False
                user_profile.can_delete_issues = False
                user_profile.can_assign_issues = False
            elif role == 'guest':
                user_profile.can_create_projects = False
                user_profile.can_delete_issues = False
                user_profile.can_assign_issues = False
        
        # Allow manual permission overrides
        for field in ['can_create_projects', 'can_delete_issues', 'can_assign_issues']:
            if field in request.data:
                setattr(user_profile, field, request.data[field])
        
        user_profile.save()
        
        serializer = UserSerializer(user)
        return Response(serializer.data)


class RegisterView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        refresh = RefreshToken.for_user(user)
        return Response({
            'user': RegisterSerializer(user).data,
            'access': str(refresh.access_token),
            'refresh': str(refresh)
        }, status=status.HTTP_201_CREATED)


class CurrentUserView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)
