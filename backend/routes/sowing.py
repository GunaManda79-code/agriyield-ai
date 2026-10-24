
from datetime import date
from typing import Optional

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field
from sqlalchemy import text

from backend.database import engine

router = APIRouter(prefix="/api/sowing", tags=["Sowing Calendar"])


class SowingTaskCreate(BaseModel):
    crop: str = Field(min_length=1, max_length=100)
    plan_key: Optional[str] = None
    task_title: str = Field(min_length=1, max_length=200)
    task_description: Optional[str] = None
    due_date: Optional[date] = None
    is_completed: bool = False


class SowingTaskUpdate(BaseModel):
    is_completed: bool


@router.post("/tasks")
def create_sowing_task(task: SowingTaskCreate):
    try:
        with engine.begin() as connection:
            result = connection.execute(
                text("""
                    INSERT INTO sowing_calendar_tasks
                   (crop, plan_key, task_title, task_description, due_date, is_completed)
VALUES
(:crop, :plan_key, :task_title, :task_description, :due_date, :is_completed)
                """),
                {
                    "crop": task.crop.strip(),
                    "plan_key": task.plan_key,
                    "task_title": task.task_title.strip(),
                    "task_description": task.task_description,
                    "due_date": task.due_date,
                    "is_completed": task.is_completed,
                },
            )
            task_id = result.lastrowid

        return {"success": True, "id": task_id, "message": "Sowing task saved"}

    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Could not save sowing task: {type(exc).__name__}",
        )


@router.get("/tasks")
def list_sowing_tasks(crop: Optional[str] = Query(default=None, max_length=100)):
    try:
        with engine.connect() as connection:
            query = """
                SELECT id, crop, plan_key, task_title, task_description,
                       due_date, is_completed, created_at
                FROM sowing_calendar_tasks
            """
            params = {}

            if crop:
                query += " WHERE crop = :crop"
                params["crop"] = crop

            query += " ORDER BY due_date ASC, id ASC"

            rows = connection.execute(
                text(query), params
            ).mappings().all()

            return {"success": True, "tasks": [dict(row) for row in rows]}

    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Could not retrieve sowing tasks: {type(exc).__name__}",
        )


@router.patch("/tasks/{task_id}")
def update_sowing_task(task_id: int, task: SowingTaskUpdate):
    try:
        with engine.begin() as connection:
            result = connection.execute(
                text("""
                    UPDATE sowing_calendar_tasks
                    SET is_completed = :is_completed
                    WHERE id = :task_id
                """),
                {
                    "is_completed": task.is_completed,
                    "task_id": task_id,
                },
            )

            if result.rowcount == 0:
                raise HTTPException(status_code=404, detail="Sowing task not found")

        return {
            "success": True,
            "id": task_id,
            "is_completed": task.is_completed,
        }

    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Could not update sowing task: {type(exc).__name__}",
        )
