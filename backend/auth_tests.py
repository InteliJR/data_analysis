import requests
import json
import logging
import time

# --- Configuração ---
BASE_URL = "http://localhost:3000/auth"

# Usaremos um e-mail novo a cada teste para evitar erro de "usuário já existe"
TEST_EMAIL = f"teste-py-{int(time.time())}@teste.com"
TEST_PASSWORD = "senha12345"

# Configura o log para imprimir tudo
logging.basicConfig(level=logging.INFO,
                    format='%(asctime)s - %(levelname)s - %(message)s')

# Criamos uma sessão para reter cookies se necessário (embora usemos tokens)
session = requests.Session()
session.headers.update({"Content-Type": "application/json"})

# Variáveis para guardar os tokens
access_token = None
refresh_token = None

def pretty_print(response):
    """Helper para imprimir a resposta de forma legível"""
    try:
        logging.info(f"Status: {response.status_code}")
        logging.info(f"Resposta: {json.dumps(response.json(), indent=2)}")
    except json.JSONDecodeError:
        logging.info(f"Resposta (não-JSON): {response.text}")

# --- Início dos Testes ---

try:
    logging.info("--- 1. Registro (Register) ---")
    payload = {
        "email": TEST_EMAIL,
        "name": "Teste Python",
        "password": TEST_PASSWORD
    }
    response = session.post(f"{BASE_URL}/register", data=json.dumps(payload))
    pretty_print(response)

    # O registro já pode retornar os tokens
    if response.status_code == 201:
        data = response.json()
        access_token = data.get('accessToken')
        refresh_token = data.get('refreshToken') # Assumindo que seu /register retorna isso
        logging.info("Registro bem-sucedido.")

except Exception as e:
    logging.error(f"Erro no Registro: {e}")


try:
    logging.info("\n--- 2. Login (Correto) ---")
    payload = {
        "email": TEST_EMAIL,
        "password": TEST_PASSWORD
    }
    response = session.post(f"{BASE_URL}/login", data=json.dumps(payload))
    pretty_print(response)

    if response.status_code == 200: # ou 201, dependendo da sua API
        data = response.json()
        access_token = data.get('accessToken')
        refresh_token = data.get('refreshToken')
        logging.info(f"Login OK. AccessToken obtido: {access_token[:15]}...")
        if not refresh_token:
            logging.warning("Refresh Token NÃO foi retornado pelo /login. Testes de /logout e /refresh podem falhar.")

except Exception as e:
    logging.error(f"Erro no Login: {e}")


if access_token:
    try:
        logging.info("\n--- 3. Obter Perfil (/me) ---")
        headers = {"Authorization": f"Bearer {access_token}"}
        response = session.get(f"{BASE_URL}/me", headers=headers)
        pretty_print(response)

    except Exception as e:
        logging.error(f"Erro no /me: {e}")
else:
    logging.warning("\n--- 3. Pular /me (sem access_token) ---")


if access_token and refresh_token:
    try:
        logging.info("\n--- 4. Logout ---")
        headers = {"Authorization": f"Bearer {access_token}"}
        payload = {"refreshToken": refresh_token}
        response = session.post(f"{BASE_URL}/logout", headers=headers, data=json.dumps(payload))
        pretty_print(response)

        # Se o logout invalidar, limpamos os tokens
        if response.status_code == 200:
            access_token = None
            logging.info("Logout bem-sucedido.")

    except Exception as e:
        logging.error(f"Erro no /logout: {e}")
else:
     logging.warning("\n--- 4. Pular /logout (sem access_token ou refresh_token) ---")


if refresh_token:
    try:
        logging.info("\n--- 5. Refresh Token ---")
        payload = {"refreshToken": refresh_token}
        response = session.post(f"{BASE_URL}/refresh", data=json.dumps(payload))
        pretty_print(response)
        # Nota: Este teste pode falhar se o logout invalidou o refresh_token,
        # o que é um comportamento esperado.

    except Exception as e:
        logging.error(f"Erro no /refresh: {e}")
else:
    logging.warning("\n--- 5. Pular /refresh (sem refresh_token) ---")


try:
    logging.info("\n--- 6. Teste de Rate Limit (Throttler) ---")
    payload = {
        "email": TEST_EMAIL,
        "password": "senhaerrada123"
    }
    # A sua API de registro mostrou um limite de 5. Vamos tentar 6 vezes.
    for i in range(1, 7):
        logging.info(f"Tentativa de login (errado) {i}/6:")
        response = session.post(f"{BASE_URL}/login", data=json.dumps(payload))
        logging.info(f"Status: {response.status_code}")
        if response.status_code == 429:
            logging.info(">>> SUCESSO! API retornou 'Too Many Requests' (429) <<<")
            pretty_print(response)
            break
        time.sleep(0.2) # Pequeno delay

except Exception as e:
    logging.error(f"Erro no teste de Rate Limit: {e}")

logging.info("\n--- Bateria de Testes Concluída ---")