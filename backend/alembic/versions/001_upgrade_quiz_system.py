"""upgrade quiz system

Revision ID: 001_upgrade_quiz_system
Revises: 
Create Date: 2025-01-19 10:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect


# revision identifiers, used by Alembic.
revision: str = '001_upgrade_quiz_system'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Get the database connection to check existing tables
    conn = op.get_bind()
    inspector = inspect(conn)
    existing_tables = inspector.get_table_names()
    
    # Check if this is a fresh database (no tables exist)
    is_fresh_database = len(existing_tables) == 0
    
    if is_fresh_database:
        # Fresh database: create all tables from scratch
        op.create_table(
            'users',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('email', sa.String(255), nullable=False),
            sa.Column('full_name', sa.String(255), nullable=False),
            sa.Column('hashed_password', sa.String(255), nullable=False),
            sa.Column('is_active', sa.Boolean(), nullable=True, server_default='true'),
            sa.Column('created_at', sa.DateTime(), nullable=True, server_default=sa.text('CURRENT_TIMESTAMP')),
            sa.PrimaryKeyConstraint('id')
        )
        op.create_index(op.f('ix_users_email'), 'users', ['email'], unique=True)
        op.create_index(op.f('ix_users_id'), 'users', ['id'], unique=False)
        
        op.create_table(
            'documents',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('user_id', sa.Integer(), nullable=False),
            sa.Column('filename', sa.String(512), nullable=False),
            sa.Column('original_filename', sa.String(512), nullable=False),
            sa.Column('file_type', sa.String(32), nullable=False),
            sa.Column('file_path', sa.String(1024), nullable=False),
            sa.Column('status', sa.String(32), nullable=True, server_default='uploaded'),
            sa.Column('extracted_text', sa.Text(), nullable=True),
            sa.Column('created_at', sa.DateTime(), nullable=True, server_default=sa.text('CURRENT_TIMESTAMP')),
            sa.Column('processed_at', sa.DateTime(), nullable=True),
            sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
            sa.PrimaryKeyConstraint('id')
        )
        op.create_index(op.f('ix_documents_id'), 'documents', ['id'], unique=False)
        
        op.create_table(
            'questions',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('document_id', sa.Integer(), nullable=False),
            sa.Column('question_text', sa.Text(), nullable=False),
            sa.Column('option_a', sa.String(512), nullable=False),
            sa.Column('option_b', sa.String(512), nullable=False),
            sa.Column('option_c', sa.String(512), nullable=False),
            sa.Column('option_d', sa.String(512), nullable=False),
            sa.Column('correct_answer', sa.String(1), nullable=False),
            sa.Column('explanation', sa.Text(), nullable=True),
            sa.Column('difficulty', sa.String(32), nullable=True, server_default='medium'),
            sa.Column('question_type', sa.String(32), nullable=True, server_default='multiple_choice'),
            sa.Column('topic', sa.String(255), nullable=True),
            sa.Column('created_at', sa.DateTime(), nullable=True, server_default=sa.text('CURRENT_TIMESTAMP')),
            sa.ForeignKeyConstraint(['document_id'], ['documents.id'], ),
            sa.PrimaryKeyConstraint('id')
        )
        op.create_index(op.f('ix_questions_id'), 'questions', ['id'], unique=False)
        
        op.create_table(
            'quizzes',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('user_id', sa.Integer(), nullable=False),
            sa.Column('document_id', sa.Integer(), nullable=True),
            sa.Column('title', sa.String(255), nullable=False),
            sa.Column('description', sa.Text(), nullable=True),
            sa.Column('time_limit_minutes', sa.Integer(), nullable=True),
            sa.Column('difficulty', sa.String(32), nullable=True, server_default='medium'),
            sa.Column('question_count', sa.Integer(), nullable=True, server_default='10'),
            sa.Column('created_at', sa.DateTime(), nullable=True, server_default=sa.text('CURRENT_TIMESTAMP')),
            sa.ForeignKeyConstraint(['document_id'], ['documents.id'], ),
            sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
            sa.PrimaryKeyConstraint('id')
        )
        op.create_index(op.f('ix_quizzes_id'), 'quizzes', ['id'], unique=False)
        
        op.create_table(
            'quiz_attempts',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('quiz_id', sa.Integer(), nullable=False),
            sa.Column('user_id', sa.Integer(), nullable=False),
            sa.Column('score', sa.Integer(), nullable=True, server_default='0'),
            sa.Column('total_questions', sa.Integer(), nullable=True, server_default='0'),
            sa.Column('answers_json', sa.Text(), nullable=True),
            sa.Column('time_taken_seconds', sa.Integer(), nullable=True, server_default='0'),
            sa.Column('started_at', sa.DateTime(), nullable=True, server_default=sa.text('CURRENT_TIMESTAMP')),
            sa.Column('completed_at', sa.DateTime(), nullable=True, server_default=sa.text('CURRENT_TIMESTAMP')),
            sa.ForeignKeyConstraint(['quiz_id'], ['quizzes.id'], ),
            sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
            sa.PrimaryKeyConstraint('id')
        )
        op.create_index(op.f('ix_quiz_attempts_id'), 'quiz_attempts', ['id'], unique=False)
        
        op.create_table(
            'quiz_answers',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('attempt_id', sa.Integer(), nullable=False),
            sa.Column('question_id', sa.Integer(), nullable=False),
            sa.Column('selected_answer', sa.String(1), nullable=False),
            sa.Column('is_correct', sa.Boolean(), nullable=True, server_default='false'),
            sa.Column('time_spent_seconds', sa.Integer(), nullable=True, server_default='0'),
            sa.Column('created_at', sa.DateTime(), nullable=True, server_default=sa.text('CURRENT_TIMESTAMP')),
            sa.ForeignKeyConstraint(['attempt_id'], ['quiz_attempts.id'], ),
            sa.ForeignKeyConstraint(['question_id'], ['questions.id'], ),
            sa.PrimaryKeyConstraint('id')
        )
        op.create_index(op.f('ix_quiz_answers_id'), 'quiz_answers', ['id'], unique=False)
    else:
        # Existing database: only add new columns and create quiz_answers table
        if 'quizzes' in existing_tables:
            quizzes_columns = [col['name'] for col in inspector.get_columns('quizzes')]
            
            if 'difficulty' not in quizzes_columns:
                op.add_column('quizzes', sa.Column('difficulty', sa.String(32), nullable=True, server_default='medium'))
            
            if 'question_count' not in quizzes_columns:
                op.add_column('quizzes', sa.Column('question_count', sa.Integer(), nullable=True, server_default='10'))
        
        if 'quiz_attempts' in existing_tables:
            attempts_columns = [col['name'] for col in inspector.get_columns('quiz_attempts')]
            
            if 'time_taken_seconds' not in attempts_columns:
                op.add_column('quiz_attempts', sa.Column('time_taken_seconds', sa.Integer(), nullable=True, server_default='0'))
            
            if 'started_at' not in attempts_columns:
                op.add_column('quiz_attempts', sa.Column('started_at', sa.DateTime(), nullable=True, server_default=sa.text('CURRENT_TIMESTAMP')))
        
        # Create quiz_answers table if it doesn't exist
        if 'quiz_answers' not in existing_tables:
            op.create_table(
                'quiz_answers',
                sa.Column('id', sa.Integer(), nullable=False),
                sa.Column('attempt_id', sa.Integer(), nullable=False),
                sa.Column('question_id', sa.Integer(), nullable=False),
                sa.Column('selected_answer', sa.String(1), nullable=False),
                sa.Column('is_correct', sa.Boolean(), nullable=True, server_default='false'),
                sa.Column('time_spent_seconds', sa.Integer(), nullable=True, server_default='0'),
                sa.Column('created_at', sa.DateTime(), nullable=True, server_default=sa.text('CURRENT_TIMESTAMP')),
                sa.ForeignKeyConstraint(['attempt_id'], ['quiz_attempts.id'], ),
                sa.ForeignKeyConstraint(['question_id'], ['questions.id'], ),
                sa.PrimaryKeyConstraint('id')
            )
            op.create_index(op.f('ix_quiz_answers_id'), 'quiz_answers', ['id'], unique=False)


def downgrade() -> None:
    # Drop quiz_answers table
    op.drop_index(op.f('ix_quiz_answers_id'), table_name='quiz_answers')
    op.drop_table('quiz_answers')
    
    # Remove columns from quiz_attempts table
    op.drop_column('quiz_attempts', 'started_at')
    op.drop_column('quiz_attempts', 'time_taken_seconds')
    
    # Remove columns from quizzes table
    op.drop_column('quizzes', 'question_count')
    op.drop_column('quizzes', 'difficulty')
