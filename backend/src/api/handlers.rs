use axum::{
    extract::ws::{Message, WebSocket, WebSocketUpgrade},
    response::IntoResponse,
    Extension,
};
use std::sync::Arc;
use tracing::{info, error};

use crate::AppState;

pub async fn ws_handler(
    ws: WebSocketUpgrade,
    Extension(state): Extension<Arc<AppState>>,
) -> impl IntoResponse {
    ws.on_upgrade(|socket| handle_socket(socket, state))
}

async fn handle_socket(mut socket: WebSocket, state: Arc<AppState>) {
    info!("React UI client connected to MEV intent telemetry stream.");

    let mut rx = state.intent_tx.subscribe();

    while let Ok(metric) = rx.recv().await {
        match serde_json::to_string(&metric) {
            Ok(json_payload) => {
                if let Err(e) = socket.send(Message::Text(json_payload)).await {
                    error!("WebSocket client disconnected: {}", e);
                    break;
                }
            }
            Err(e) => {
                error!("Serialization error: {}", e);
            }
        }
    }
    
    info!("React UI client disconnected.");
}