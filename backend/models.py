from datetime import datetime
from extensions import db

class Province(db.Model):
    """省份模型"""
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), unique=True, nullable=False)
    coverage = db.Column(db.String(200))  # JSON格式存储覆盖层次
    
    schools = db.relationship('School', backref='province', lazy='dynamic')
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'coverage': self.coverage.split(',') if self.coverage else []
        }

class School(db.Model):
    """院校模型"""
    id = db.Column(db.Integer, primary_key=True)
    province_id = db.Column(db.Integer, db.ForeignKey('province.id'))
    school_name = db.Column(db.String(100), nullable=False)
    tier = db.Column(db.String(20))  # 985, 211, 双一流, 双非, 行业特色
    industry = db.Column(db.String(50))  # 行业特色标签
    score = db.Column(db.Float)  # 录取分数线
    rank = db.Column(db.Integer)  # 录取位次
    note = db.Column(db.Text)  # 备注信息
    
    def to_dict(self):
        return {
            'id': self.id,
            'school': self.school_name,
            'score': self.score,
            'rank': self.rank,
            'tier': self.tier,
            'industry': self.industry,
            'note': self.note,
            'province': self.province.name if self.province else ''
        }

class Major(db.Model):
    """专业模型"""
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    category = db.Column(db.String(50))  # 专业类别
    description = db.Column(db.Text)  # 专业描述
    employment = db.Column(db.Text)  # 就业前景
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'category': self.category,
            'description': self.description,
            'employment': self.employment
        }

class UserProfile(db.Model):
    """用户档案模型"""
    id = db.Column(db.Integer, primary_key=True)
    province_id = db.Column(db.Integer, db.ForeignKey('province.id'))
    score = db.Column(db.Float)  # 高考分数
    rank = db.Column(db.Integer)  # 省位次
    mode = db.Column(db.String(20))  # 考试模式（物理/历史）
    first_choice = db.Column(db.String(100))  # 首选科目
    track = db.Column(db.String(20))  # 选科组合
    category = db.Column(db.String(20))  # 招生类别
    weights_major = db.Column(db.Integer, default=34)  # 专业权重
    weights_school = db.Column(db.Integer, default=33)  # 院校权重
    weights_city = db.Column(db.Integer, default=33)  # 城市权重
    created_at = db.Column(db.DateTime, default=datetime.now)
    updated_at = db.Column(db.DateTime, default=datetime.now, onupdate=datetime.now)
    
    province = db.relationship('Province', backref='user_profiles')
    
    def to_dict(self):
        return {
            'id': self.id,
            'province': self.province.name if self.province else '',
            'province_id': self.province_id,
            'score': self.score,
            'rank': self.rank,
            'mode': self.mode,
            'first': self.first_choice,
            'track': self.track,
            'category': self.category,
            'weights': {
                'major': self.weights_major,
                'school': self.weights_school,
                'city': self.weights_city
            },
            'created_at': self.created_at.strftime('%Y-%m-%d %H:%M:%S'),
            'updated_at': self.updated_at.strftime('%Y-%m-%d %H:%M:%S')
        }

class HollandResult(db.Model):
    """霍兰德测试结果模型"""
    id = db.Column(db.Integer, primary_key=True)
    user_profile_id = db.Column(db.Integer, db.ForeignKey('user_profile.id'))
    code = db.Column(db.String(3))  # 霍兰德代码（如RIA）
    scores_r = db.Column(db.Integer, default=0)
    scores_i = db.Column(db.Integer, default=0)
    scores_a = db.Column(db.Integer, default=0)
    scores_s = db.Column(db.Integer, default=0)
    scores_e = db.Column(db.Integer, default=0)
    scores_c = db.Column(db.Integer, default=0)
    suggestions = db.Column(db.Text)  # 推荐专业列表（JSON）
    created_at = db.Column(db.DateTime, default=datetime.now)
    
    user_profile = db.relationship('UserProfile', backref='holland_results')
    
    def to_dict(self):
        import json
        return {
            'id': self.id,
            'code': self.code,
            'allScores': {
                'R': self.scores_r,
                'I': self.scores_i,
                'A': self.scores_a,
                'S': self.scores_s,
                'E': self.scores_e,
                'C': self.scores_c
            },
            'suggestions': json.loads(self.suggestions) if self.suggestions else [],
            'created_at': self.created_at.strftime('%Y-%m-%d %H:%M:%S')
        }

class UserMajorPreference(db.Model):
    """用户专业偏好模型"""
    id = db.Column(db.Integer, primary_key=True)
    user_profile_id = db.Column(db.Integer, db.ForeignKey('user_profile.id'))
    major_id = db.Column(db.Integer, db.ForeignKey('major.id'))
    preference_type = db.Column(db.String(10))  # like/dislike
    
    user_profile = db.relationship('UserProfile', backref='major_preferences')
    major = db.relationship('Major', backref='preferences')
    
    def to_dict(self):
        return {
            'id': self.id,
            'major_name': self.major.name,
            'preference_type': self.preference_type
        }

class RecommendPlan(db.Model):
    """推荐方案模型"""
    id = db.Column(db.Integer, primary_key=True)
    user_profile_id = db.Column(db.Integer, db.ForeignKey('user_profile.id'))
    plan_data = db.Column(db.Text)  # 完整方案数据（JSON）
    created_at = db.Column(db.DateTime, default=datetime.now)
    
    user_profile = db.relationship('UserProfile', backref='recommend_plans')
    
    def to_dict(self):
        import json
        return {
            'id': self.id,
            'plan_data': json.loads(self.plan_data) if self.plan_data else {},
            'created_at': self.created_at.strftime('%Y-%m-%d %H:%M:%S')
        }

class KnowledgeBase(db.Model):
    """知识库模型（RAG）"""
    id = db.Column(db.Integer, primary_key=True)
    content = db.Column(db.Text, nullable=False)  # 知识内容
    source = db.Column(db.String(100))  # 来源
    keywords = db.Column(db.String(200))  # 关键词
    created_at = db.Column(db.DateTime, default=datetime.now)
    
    def to_dict(self):
        return {
            'id': self.id,
            'content': self.content,
            'source': self.source,
            'keywords': self.keywords.split(',') if self.keywords else [],
            'created_at': self.created_at.strftime('%Y-%m-%d %H:%M:%S')
        }
