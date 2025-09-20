from django.contrib import admin
from .models import Project, Issue, Comment

@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = ('id','name','created_at')

@admin.register(Issue)
class IssueAdmin(admin.ModelAdmin):
    list_display = ('id','title','project','status','priority','reporter','assignee','created_at')
    list_filter = ('status','priority','project')

@admin.register(Comment)
class CommentAdmin(admin.ModelAdmin):
    list_display = ('id','issue','author','created_at')
