from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Project, Issue, Comment
from .serializers import ProjectSerializer, IssueSerializer, CommentSerializer, RegisterSerializer
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from django.shortcuts import get_object_or_404
from django.contrib.auth.models import User
from rest_framework import serializers
from django.db.models import Q

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email']

class IsReporterOrAssignee(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        user = request.user
        return obj.reporter == user or obj.assignee == user

class ProjectViewSet(viewsets.ModelViewSet):
    queryset = Project.objects.all().order_by('-created_at')
    serializer_class = ProjectSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    pagination_class = None  # Disable pagination for projects

    def perform_create(self, serializer):
        serializer.save()

class IssueViewSet(viewsets.ModelViewSet):
    queryset = Issue.objects.select_related('project','reporter','assignee').all().order_by('-created_at')
    serializer_class = IssueSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        project_id = self.kwargs.get('project_pk')
        queryset = self.queryset
        
        if project_id:
            queryset = queryset.filter(project_id=project_id)
        
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
            project = get_object_or_404(Project, pk=project_id)
            serializer.save(project=project, reporter=self.request.user)
        else:
            # Handle top-level creation if project is provided in data
            serializer.save(reporter=self.request.user)

    def get_permissions(self):
        if self.action in ['partial_update','update']:
            return [permissions.IsAuthenticated(), IsReporterOrAssignee()]
        return super().get_permissions()

class CommentViewSet(viewsets.ModelViewSet):
    queryset = Comment.objects.select_related('issue','author').prefetch_related('replies__author').all().order_by('created_at')
    serializer_class = CommentSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        issue_id = self.kwargs.get('issue_pk')
        queryset = self.queryset
        if issue_id:
            queryset = queryset.filter(issue_id=issue_id)
        
        # Only return top-level comments (no parent) for the main list
        # Replies are included via the serializer
        return queryset.filter(parent_comment__isnull=True)

    def perform_create(self, serializer):
        issue_id = self.kwargs.get('issue_pk')
        issue = get_object_or_404(Issue, pk=issue_id)
        
        # Check if this is a reply to another comment
        parent_comment_id = self.request.data.get('parent_comment')
        parent_comment = None
        if parent_comment_id:
            parent_comment = get_object_or_404(Comment, pk=parent_comment_id, issue=issue)
        
        serializer.save(issue=issue, author=self.request.user, parent_comment=parent_comment)


class UserViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]


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
