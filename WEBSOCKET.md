# WebSocket Endpoints Documentation

This document outlines all WebSocket endpoints available in the payment application.

## Server Configuration

- **Protocol**: WSS (WebSocket Secure)
- **Port**: 3000 (configurable via APP_PORT)
- **Host**: localhost (configurable via APP_HOST)
- **SSL**: Required (uses SSL certificates from /ssl directory)

## WebSocket Endpoints

### 1. M-PESA STK Push WebSocket

**Endpoint**: `wss://localhost:3000/mpesa/stk/:hash`

**Purpose**: Handles M-PESA STK (Sim Toolkit) push payments in real-time

**Parameters**:

- `hash`: Unique identifier for the WebSocket connection

**Message Types**:

#### Push Payment Request

```json
{
  "kind": "push",
  "payload": {
    "phone": "254712345678",
    "amount": 100,
    "description": "Payment description"
  }
}
```

#### Check Payment Status

```json
{
  "kind": "status",
  "payload": {
    "checkout": "checkout_request_id"
  }
}
```

**Response Types**:

- Success responses with payment data
- Error responses with error codes and messages
- Status updates for payment processing

**Features**:

- Connection tracking via hash
- Message validation
- Real-time payment status updates
- Subscription to topic: `/mpesa/{hash}`

---

### 2. M-PESA B2C (Business to Customer) WebSocket

**Endpoint**: `wss://localhost:3000/mpesa/b2c/:hash`

**Purpose**: Handles M-PESA B2C withdrawals/transfers in real-time

**Parameters**:

- `hash`: Unique identifier for the WebSocket connection

**Message Types**:

#### Withdrawal Request

```json
{
  "kind": "withdraw",
  "payload": {
    "phone": "254712345678",
    "amount": 500,
    "description": "Withdrawal request"
  }
}
```

**Response Types**:

- Success responses with transaction details
- Error responses with error codes
- Withdrawal status updates

**Features**:

- Connection tracking via hash
- Message validation
- Real-time withdrawal processing
- Subscription to topic: `/mpesa/b2c/{hash}`

---

## HTTP Endpoints (Related to WebSockets)

### STK Push Service

- `POST /api/v1/mpesa/stk/push` - Initiate STK push
- `POST /api/v1/mpesa/stk/callback/:hash` - STK callback handler

### B2C Service

- `POST /api/v1/mpesa/b2c/queue/:hash` - Queue withdrawal request
- `POST /api/v1/mpesa/b2c/withdraw/:hash` - Handle withdrawal result

---

## Connection Details

### WebSocket Configuration

- **Compression**: Shared compressor enabled
- **Max Payload**: 16MB (16 *1024* 1024 bytes)
- **Idle Timeout**: 960 seconds
- **Message Format**: JSON

### Connection Flow

1. Client connects to WebSocket endpoint with hash parameter
2. Server upgrades HTTP connection to WebSocket
3. Connection is stored in memory with hash as key
4. Client can send JSON messages with specific "kind" types
5. Server validates and processes messages
6. Real-time responses sent back to client

### Error Handling

- Invalid JSON parsing errors
- Validation errors with specific error codes
- Connection upgrade errors
- Timeout handling

---

## Usage Examples

### Connecting to STK WebSocket

```javascript
const ws = new WebSocket('wss://localhost:3000/mpesa/stk/user123');

ws.onopen = function() {
    // Send STK push request
    ws.send(JSON.stringify({
        kind: 'push',
        payload: {
            phone: '254712345678',
            amount: 100,
            description: 'Payment for services'
        }
    }));
};

ws.onmessage = function(event) {
    const response = JSON.parse(event.data);
    console.log('Response:', response);
};
```

### Connecting to B2C WebSocket

```javascript
const ws = new WebSocket('wss://localhost:3000/mpesa/b2c/user456');

ws.onopen = function() {
    // Send withdrawal request
    ws.send(JSON.stringify({
        kind: 'withdraw',
        payload: {
            phone: '254712345678',
            amount: 500,
            description: 'Withdrawal request'
        }
    }));
};
```

---

## Security Features

- SSL/TLS encryption required
- Hash-based connection identification
- Message validation before processing
- Error handling with specific error codes
- Connection timeout management

---

## Integration Points

- **Database**: MongoDB for transaction storage
- **Validation**: Custom validators for M-PESA data
- **Utils**: M-PESA utility functions for API calls
- **Queues**: Background job processing support
- **Logging**: Connection and error logging
