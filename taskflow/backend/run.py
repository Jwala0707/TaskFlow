import os
from dotenv import load_dotenv

load_dotenv()

from app import create_app, db

app = create_app(os.environ.get("FLASK_ENV", "development"))

with app.app_context():
    db.create_all()

if __name__ == "__main__":
    app.run(debug=app.config["DEBUG"], port=5000)
