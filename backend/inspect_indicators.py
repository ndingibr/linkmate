from app.core.db import get_engine
from sqlalchemy import text, inspect

engine = get_engine()
inspector = inspect(engine)

for table in ["stocks_score_by_date", "company_list", "predicted_scores_march_2026"]:
    if table in inspector.get_table_names():
        print(f"\n--- {table} ---")
        print("Columns:", [col["name"] for col in inspector.get_columns(table)])
        with engine.connect() as conn:
            cnt = conn.execute(text(f"SELECT COUNT(*) FROM {table}")).fetchone()
            print("Row count:", cnt[0])
            if cnt[0] > 0:
                sample = conn.execute(text(f"SELECT * FROM {table} LIMIT 3")).fetchall()
                print("Sample rows:")
                for r in sample:
                    print(r)
