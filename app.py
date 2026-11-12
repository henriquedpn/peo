from flask import Flask, request, jsonify, send_file
import json
import os
import traceback

app = Flask(__name__, static_folder=".", static_url_path="")

DB_FILE = "db.json"
LAYOUT_FILE = "layout.json"

def load_db():
    try:
        if not os.path.exists(DB_FILE):
            return {"records": [], "language": "pt"}
        with open(DB_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        raise Exception(f"Erro ao carregar banco: {str(e)}")

def save_db(data):
    try:
        with open(DB_FILE, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=True, indent=2)
    except Exception as e:
        raise Exception(f"Erro ao salvar banco: {str(e)}")

@app.route("/")
def index():
    return send_file("page.html")

@app.route("/api/records", methods=["GET"])
def get_records():
    try:
        return jsonify(load_db())
    except Exception:
        return jsonify({"error": traceback.format_exc()}), 500

@app.route("/api/layout/load", methods=["GET"])
def get_layout():

    try:

        return jsonify(
            load_layout()
        )

    except Exception:

        return jsonify({
            "error":
            traceback.format_exc()
        }), 500

@app.route("/api/record/<int:index>", methods=["GET"])
def get_record(index):
    try:
        db = load_db()

        if index < 0 or index >= len(db["records"]):
            return jsonify({"error": "Registro não encontrado"}), 404

        return jsonify(db["records"][index])

    except Exception:
        return jsonify({"error": traceback.format_exc()}), 500

@app.route("/api/update", methods=["POST"])
def update_record():
    try:
        payload = request.json

        idx = payload["index"]
        field = payload["field"]
        value = payload["value"]

        db = load_db()

        db["records"][idx][field] = value

        save_db(db)

        return jsonify({"success": True})

    except Exception:
        return jsonify({"error": traceback.format_exc()}), 500

@app.route("/api/upload", methods=["POST"])
def upload_excel():
    try:
        file = request.files["file"]

        import pandas as pd

        # Lê a planilha sem assumir tabela estruturada
        raw_df = pd.read_excel(
            file,
            sheet_name="3. Ativos",
            header=None
        )

        raw_df = raw_df.fillna("")

        # Linha 3 da planilha = índice 2 do DataFrame
        headers = [
            str(col).strip()
            for col in raw_df.iloc[2].tolist()
        ]

        # Registros começam na linha 5 da planilha = índice 4
        data_df = raw_df.iloc[4:].copy()

        # Mantém identificação por nome de coluna
        data_df.columns = headers

        records = []

        for _, row in data_df.iterrows():

            codigo = str(row.get("Código do Requisito", "")).strip()

            requisito = str(row.get("Requisito", "")).strip()

            # Ignora linhas totalmente vazias
            if not codigo and not requisito:
                continue

            records.append({
                "agenda_base": str(row.get("Agenda Base", "")).strip(),
                "agenda_sonda": str(row.get("Agenda Sonda", "")).strip(),
                "codigo": codigo,
                "requisito": requisito,
                "requisitominimo": str(row.get("Requisito Mínimo", "")).strip(),
                "orientacoes": str(row.get("Orientações", "")).strip(),
                "autoavaliacao": str(row.get("Auto-avaliação", "")).strip(),
                "autoavaliacaodt": str(row.get("Auto-avaliação Detalhada", "")).strip(),
                "auditado": str(row.get("Auditado", "")).strip(),
                "apoio": str(row.get("Apoio", "")).strip()
            })

        db = {
            "records": records
        }

        save_db(db)

        return jsonify({
            "success": True,
            "total": len(records)
        })

    except Exception:
        return jsonify({
            "error": traceback.format_exc()
        }), 500

def load_layout():

    try:

        if not os.path.exists(
            LAYOUT_FILE
        ):

            return {
                "fields": []
            }

        with open(
            LAYOUT_FILE,
            "r",
            encoding="utf-8"
        ) as f:

            return json.load(f)

    except Exception as e:

        raise Exception(
            f"Erro ao carregar layout: {str(e)}"
        )

def save_layout(data):

    try:

        with open(
            LAYOUT_FILE,
            "w",
            encoding="utf-8"
        ) as f:

            json.dump(
                data,
                f,
                ensure_ascii=False,
                indent=2
            )

    except Exception as e:

        raise Exception(
            f"Erro ao salvar layout: {str(e)}"
        )

@app.route(
    "/api/layout/save",
    methods=["POST"]
)
def save_layout_api():

    try:

        payload = request.json

        save_layout(payload)

        return jsonify({
            "success": True
        })

    except Exception:

        return jsonify({
            "error":
            traceback.format_exc()
        }), 500
                
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 10000))

    app.run(
        host="0.0.0.0",
        port=port,
        threaded=True
    )
