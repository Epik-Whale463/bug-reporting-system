from django.contrib import admin
from .models import Project, Issue, Comment, UserProfile

@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'role', 'can_create_projects', 'can_delete_issues', 'can_assign_issues', 'created_at')
    list_filter = ('role', 'can_create_projects', 'can_delete_issues', 'can_assign_issues')
    search_fields = ('user__username', 'user__email')
    fieldsets = (
        ('User Information', {
            'fields': ('user', 'role')
        }),
        ('Permissions', {
            'fields': ('can_create_projects', 'can_delete_issues', 'can_assign_issues')
        }),
    )

@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = ('id','name','owner','created_at')
    list_filter = ('created_at',)
    search_fields = ('name', 'description', 'owner__username')

@admin.register(Issue)
class IssueAdmin(admin.ModelAdmin):
    list_display = ('id','title','project','status','priority','reporter','assignee','created_at')
    list_filter = ('status','priority','project','created_at')
    search_fields = ('title', 'description', 'reporter__username', 'assignee__username')
    date_hierarchy = 'created_at'

@admin.register(Comment)
class CommentAdmin(admin.ModelAdmin):
    list_display = ('id','issue','author','created_at','is_reply')
    list_filter = ('created_at',)
    search_fields = ('content', 'author__username', 'issue__title')
    date_hierarchy = 'created_at'
    
    def is_reply(self, obj):
        return obj.parent_comment is not None
    is_reply.boolean = True
