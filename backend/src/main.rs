// MEV Intent Sentinel - Core Orchestrator
// Dark Forest Mempool Intent Decoder & Paritok Token-Efficiency Engine

mod api;
mod mempool;
mod ai;
mod engine;

use axum::{
    routing::get,
    Router,
    Extension,
};
use std::sync::Arc;
use tokio::sync::{mpsc, broadcast};
use tower_http::cors::{Any, CorsLayer};
use tracing::{info, error, Level};
use tracing_subscriber::FmtSubscriber;
use dotenvy::dotenv;

pub struct AppState {
    pub intent_tx: broadcast::Sender<engine::MevIntentMetrics>,
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // 1. Initialize environment and high-performance logging
    dotenv().ok();
    let subscriber = FmtSubscriber::builder()
        .with_max_level(Level::INFO)
        .finish();
    tracing::subscriber::set_global_default(subscriber)
        .expect("Failed to set global tracing subscriber");

    info!("🚀 Booting MEV Intent Sentinel Engine...");

    // 2. Concurrency Channels Setup
    // mpsc for Raw Mempool Transactions -> Paritok AI Intent Pruner
    let (raw_tx_sender, raw_tx_receiver) = mpsc::channel::<mempool::RawMempoolTx>(5000);

    // broadcast for Decoded Intent Metrics -> React UI Clients
    let (intent_tx, _) = broadcast::channel::<engine::MevIntentMetrics>(100);
    let app_state = Arc::new(AppState {
        intent_tx: intent_tx.clone(),
    });

    // 3. Spawn the EVM Mempool Ingestion Worker
    let tx_sender_clone = raw_tx_sender.clone();
    tokio::spawn(async move {
        info!("Spawning EVM WebSocket Mempool Ingestion Worker...");
        if let Err(e) = mempool::ws_listener::start_mempool_stream(tx_sender_clone).await {
            error!("Mempool ingestion worker crashed: {}", e);
        }
    });

    // 4. Spawn the Paritok Compression & DFA Risk Engine Worker
    let engine_intent_tx = intent_tx.clone();
    tokio::spawn(async move {
        info!("Spawning Paritok AI Intent Pruner & DFA Engine...");
        if let Err(e) = engine::pipeline::run(raw_tx_receiver, engine_intent_tx).await {
            error!("Engine worker crashed: {}", e);
        }
    });

    // 5. Configure Axum Web Server
    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods(Any)
        .allow_headers(Any);

    let app = Router::new()
        .route("/ws", get(api::handlers::ws_handler))
        .layer(Extension(app_state))
        .layer(cors);

    // 6. Bind and Serve
    let port = std::env::var("PORT").unwrap_or_else(|_| "8080".to_string());
    let addr = format!("0.0.0.0:{}", port);
    let listener = tokio::net::TcpListener::bind(&addr).await.unwrap();
    
    info!("🛡️ MEV Intent Sentinel API & WebSocket server listening on {}", addr);
    
    axum::serve(listener, app).await.unwrap();

    Ok(())
}