from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_nested import routers
from .views import ProjectViewSet, IssueViewSet, CommentViewSet, UserViewSet

# Top-level router for projects and issues
router = DefaultRouter()
router.register(r'projects', ProjectViewSet, basename='project')
router.register(r'issues', IssueViewSet, basename='issue')
router.register(r'comments', CommentViewSet, basename='comment')
router.register(r'users', UserViewSet, basename='user')

# Nested router for project -> issues (as per requirements: POST /projects/<id>/issues/)
project_router = routers.NestedDefaultRouter(router, r'projects', lookup='project')
project_router.register(r'issues', IssueViewSet, basename='project-issues')

# Comments directly under issues (as per requirements: POST /issues/<id>/comments/)
issue_router = routers.NestedDefaultRouter(router, r'issues', lookup='issue')
issue_router.register(r'comments', CommentViewSet, basename='issue-comments')

urlpatterns = [
    path('', include(router.urls)),
    path('', include(project_router.urls)),
    path('', include(issue_router.urls)),
]
