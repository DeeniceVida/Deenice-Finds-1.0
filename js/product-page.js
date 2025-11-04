/* Stock status styles */
.stock-status {
    padding: 8px 12px;
    border-radius: 6px;
    margin: 10px 0;
    font-weight: 500;
    display: flex;
    align-items: center;
    gap: 8px;
}

.stock-status.in-stock {
    background: #d4edda;
    color: #155724;
    border: 1px solid #c3e6cb;
}

.stock-status.low-stock {
    background: #fff3cd;
    color: #856404;
    border: 1px solid #ffeaa7;
}

.stock-status.out-of-stock {
    background: #f8d7da;
    color: #721c24;
    border: 1px solid #f5c6cb;
}

.stock-indicator {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    display: inline-block;
}

.in-stock .stock-indicator { background: #28a745; }
.low-stock .stock-indicator { background: #ffc107; }
.out-of-stock .stock-indicator { background: #dc3545; }

.quantity-container {
    margin: 15px 0;
}

.error-message {
    color: #dc3545;
    font-size: 0.9em;
    margin-top: 5px;
    padding: 5px;
    background: #f8d7da;
    border-radius: 4px;
    border: 1px solid #f5c6cb;
}

.out-of-stock-message {
    background: #fff3cd;
    color: #856404;
    padding: 12px;
    border-radius: 6px;
    margin-top: 10px;
    border: 1px solid #ffeaa7;
    text-align: center;
}

.color-option.disabled {
    opacity: 0.5;
    cursor: not-allowed !important;
}

.color-option.disabled:hover {
    transform: none !important;
    box-shadow: none !important;
}
