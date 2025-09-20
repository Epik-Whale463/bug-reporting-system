from rest_framework import serializers
from .models import Project, Issue, Comment
from django.contrib.auth import get_user_model

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id','username','email')

class ProjectSerializer(serializers.ModelSerializer):
    owner = UserSerializer(read_only=True)
    issue_count = serializers.IntegerField(read_only=True)
    open_issues = serializers.IntegerField(read_only=True)
    in_progress_issues = serializers.IntegerField(read_only=True)
    closed_issues = serializers.IntegerField(read_only=True)
    class Meta:
        model = Project
        fields = ('id','name','description','created_at','owner','issue_count','open_issues','in_progress_issues','closed_issues')

class IssueSerializer(serializers.ModelSerializer):
    reporter = UserSerializer(read_only=True)
    assignee = UserSerializer(read_only=True)
    assignee_id = serializers.IntegerField(write_only=True, required=False, allow_null=True)
    # When creating issues via the nested project route (POST /projects/<id>/issues/)
    # the view will inject the project on save. Mark project as read-only so
    # serializer validation does not require the project field in the incoming payload.
    project = ProjectSerializer(read_only=True)

    class Meta:
        model = Issue
        fields = ('id','title','description','status','priority','created_at','updated_at','project','reporter','assignee','assignee_id')
        read_only_fields = ('reporter','created_at','updated_at','project')

    def update(self, instance, validated_data):
        # Handle assignee_id separately
        assignee_id = validated_data.pop('assignee_id', None)
        if assignee_id is not None:
            # Allow clearing assignee by sending null/empty/0
            if assignee_id == 0 or assignee_id == '':
                instance.assignee = None
            else:
                try:
                    assignee = User.objects.get(id=assignee_id)
                    instance.assignee = assignee
                except User.DoesNotExist:
                    raise serializers.ValidationError({'assignee_id': 'User with this id does not exist.'})
        
        # Update other fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        
        instance.save()
        return instance

class CommentSerializer(serializers.ModelSerializer):
    author = UserSerializer(read_only=True)
    replies = serializers.SerializerMethodField()
    reply_count = serializers.SerializerMethodField()

    class Meta:
        model = Comment
        fields = ('id','content','created_at','issue','author','parent_comment','replies','reply_count')
        read_only_fields = ('author','created_at','issue')
    
    def get_replies(self, obj):
        if obj.replies.exists():
            return CommentSerializer(obj.replies.all(), many=True).data
        return []
    
    def get_reply_count(self, obj):
        return obj.replies.count()


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True)

    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'password')

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data.get('email',''),
            password=validated_data['password']
        )
        return user
