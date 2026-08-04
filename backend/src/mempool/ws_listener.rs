use alloy::providers::{Provider, ProviderBuilder, WsConnect};
use alloy::consensus::Transaction as TxTrait;
use futures_util::StreamExt;
use serde::{Deserialize, Serialize};
use tokio::sync::mpsc;
use tracing::{info, warn, error};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RawMempoolTx {
    pub hash: String,
    pub from: String,
    pub to: Option<String>,
    pub value: String,
    pub calldata_hex: String,
    pub gas_price: u128,
}

pub async fn start_mempool_stream(tx_sender: mpsc::Sender<RawMempoolTx>) -> Result<(), Box<dyn std::error::Error>> {
    // Connect to EVM WebSocket provider (defaults to Monad / Localhost Anvil testnet node)
    let ws_url = std::env::var("EVM_WS_URL").unwrap_or_else(|_| "wss://testnet-rpc.monad.xyz/ws".to_string());
    
    info!("Connecting to EVM Mempool WSS at {}", ws_url);
    
    let ws = WsConnect::new(&ws_url);
    let provider = match ProviderBuilder::new().connect_ws(ws).await {
        Ok(p) => p,
        Err(e) => {
            warn!("Failed to connect to primary EVM RPC ({}), falling back to mock event stream generator.", e);
            return run_mock_mempool_stream(tx_sender).await;
        }
    };

    // Subscribe to pending transaction hashes
    let sub = provider.subscribe_pending_transactions().await?;
    let mut stream = sub.into_stream();

    info!("Successfully subscribed to live EVM pending transaction feed.");

    while let Some(tx_hash) = stream.next().await {
        // Fetch transaction details by hash
        match provider.get_transaction_by_hash(tx_hash).await {
            Ok(Some(transaction)) => {
                let raw_tx = RawMempoolTx {
                    hash: transaction.inner.tx_hash().to_string(),
                    from: transaction.inner.signer().to_string(),
                    to: TxTrait::to(transaction.inner.inner()).map(|t| t.to_string()),
                    value: TxTrait::value(transaction.inner.inner()).to_string(),
                    calldata_hex: hex::encode(TxTrait::input(transaction.inner.inner())),
                    gas_price: TxTrait::gas_price(transaction.inner.inner()).unwrap_or(20_000_000_000),
                };

                if tx_sender.send(raw_tx).await.is_err() {
                    error!("Mempool channel closed. Stopping ingestion.");
                    break;
                }
            }
            Ok(None) => {}
            Err(e) => {
                warn!("Failed to fetch pending transaction details: {}", e);
            }
        }
    }

    Ok(())
}

async fn run_mock_mempool_stream(tx_sender: mpsc::Sender<RawMempoolTx>) -> Result<(), Box<dyn std::error::Error>> {
    info!("Running robust simulated EVM mempool generator for testnet demonstration.");
    let mut counter: u64 = 0;
    
    loop {
        tokio::time::sleep(tokio::time::Duration::from_millis(400)).await;
        counter += 1;

        let is_sandwich = counter % 5 == 0;
        let calldata = if is_sandwich {
            "0xa9059cbb00000000000000000000000071c7656ec7ab88b098defb751b7401b5f6d8976f000000000000000000000000000000000000000000000000000de0b6b3a76400".to_string()
        } else {
            format!("0x608060405234801561001057600080fd5b50600436106100365760003560e01c806370a082311461003b575b600080fd5555{}", counter)
        };

        let raw_tx = RawMempoolTx {
            hash: format!("0x{:064x}", counter * 999999),
            from: format!("0x71c7656ec7ab88b098defb751b7401b5f6d8{}", counter % 1000),
            to: Some("0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2".to_string()),
            value: "1000000000000000000".to_string(),
            calldata_hex: calldata,
            gas_price: 35_000_000_000_u128 + (counter % 10) as u128 * 5_000_000_000_u128,
        };

        if tx_sender.send(raw_tx).await.is_err() {
            break;
        }
    }

    Ok(())
}