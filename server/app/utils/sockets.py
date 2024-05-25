import socketio
import http.cookies
from fastapi import Request, HTTPException
from app.utils import session_mgr
from app.utils.payload import LoginRequired
from app.database.schema import TypeOfUser

sio_server = socketio.AsyncServer(
    async_mode='asgi',
    cors_allowed_origins=["http://localhost:5173"]
)

sio_app = socketio.ASGIApp(
    socketio_server=sio_server,
    socketio_path='job_socket'
)

@sio_server.on('connect')
async def connect(sid, env):
    try:
        sio_server.environ.setdefault(sid, {})
        cookies = http.cookies.SimpleCookie(env.get('HTTP_COOKIE', '')).get('session')
        if cookies:
            session_id = cookies.value
        else:
            session_id = None
        user = await LoginRequired(roles_required={TypeOfUser.REGULAR, TypeOfUser.PREMIUM}).verify_session_id(session_id)
        print(f"Client {sid} connected: {user['email']}")

        # Store the authenticated user information in the Socket.IO session
        sio_server.environ[sid]['user'] = user['email']
        session_mgr.connections[user['email']].add(sid)

    except HTTPException as e:
        print(f"Connection rejected for {sid}: {e.detail}")
        await sio_server.disconnect(sid)

@sio_server.on('disconnect')
async def disconnect(sid):
    print(f"Client {sid} disconnected")
    user_email = sio_server.environ[sid].get('user')
    if user_email:
        session_mgr.connections[user_email].discard(sid)
    