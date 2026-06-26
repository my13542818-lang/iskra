<?php
// ========================================
// payment-callback.php — ОБРАБОТЧИК PAYANYWAY
// ========================================

// ===== КОНФИГУРАЦИЯ =====
$MNT_ID = '99389874';
$MNT_INTEGRITY_CODE = '12345';

// ===== ПОЛУЧАЕМ ДАННЫЕ ОТ PAYANYWAY =====
$transactionId = $_POST['MNT_TRANSACTION_ID'] ?? $_GET['MNT_TRANSACTION_ID'] ?? '';
$amount = $_POST['MNT_AMOUNT'] ?? $_GET['MNT_AMOUNT'] ?? 0;
$operationId = $_POST['MNT_OPERATION_ID'] ?? $_GET['MNT_OPERATION_ID'] ?? '';
$subscriberId = $_POST['MNT_SUBSCRIBER_ID'] ?? $_GET['MNT_SUBSCRIBER_ID'] ?? '';
$testMode = $_POST['MNT_TEST_MODE'] ?? $_GET['MNT_TEST_MODE'] ?? '1';
$signature = $_POST['MNT_SIGNATURE'] ?? $_GET['MNT_SIGNATURE'] ?? '';
$currencyCode = $_POST['MNT_CURRENCY_CODE'] ?? $_GET['MNT_CURRENCY_CODE'] ?? 'RUB';

// ===== ПРОВЕРЯЕМ ПОДПИСЬ =====
// MNT_SIGNATURE = md5(MNT_ID + MNT_TRANSACTION_ID + MNT_OPERATION_ID + MNT_AMOUNT + MNT_CURRENCY_CODE + MNT_SUBSCRIBER_ID + MNT_TEST_MODE + MNT_INTEGRITY_CODE)
$signatureData = $MNT_ID . $transactionId . $operationId . $amount . $currencyCode . $subscriberId . $testMode . $MNT_INTEGRITY_CODE;
$expectedSignature = md5($signatureData);

// ===== ЛОГИРУЕМ ДЛЯ ОТЛАДКИ =====
file_put_contents('payanyway.log', date('Y-m-d H:i:s') . " | Transaction: $transactionId | Amount: $amount | Status: " . ($signature === $expectedSignature ? 'OK' : 'FAIL') . "\n", FILE_APPEND);

// ===== ЕСЛИ ПОДПИСЬ НЕ СОВПАДАЕТ — ОТВЕЧАЕМ ОШИБКОЙ =====
if ($signature !== $expectedSignature) {
    header('Content-Type: application/xml');
    echo '<?xml version="1.0" encoding="UTF-8"?>';
    echo '<MNT_RESPONSE>';
    echo '<MNT_ID>' . $MNT_ID . '</MNT_ID>';
    echo '<MNT_TRANSACTION_ID>' . $transactionId . '</MNT_TRANSACTION_ID>';
    echo '<MNT_RESULT_CODE>500</MNT_RESULT_CODE>';
    echo '<MNT_SIGNATURE>' . md5('500' . $MNT_ID . $transactionId . $MNT_INTEGRITY_CODE) . '</MNT_SIGNATURE>';
    echo '</MNT_RESPONSE>';
    exit;
}

// ===== РАЗБИРАЕМ MNT_TRANSACTION_ID =====
// Формат: timestamp|userId|amount
$parts = explode('|', $transactionId);
$timestamp = $parts[0] ?? '';
$userId = $parts[1] ?? '';
$orderAmount = $parts[2] ?? 0;

// ===== ПРОВЕРЯЕМ СУММУ =====
if (abs($amount - $orderAmount) > 0.01) {
    file_put_contents('payanyway.log', "❌ Сумма не совпадает: $amount != $orderAmount\n", FILE_APPEND);
    header('Content-Type: application/xml');
    echo '<?xml version="1.0" encoding="UTF-8"?>';
    echo '<MNT_RESPONSE>';
    echo '<MNT_ID>' . $MNT_ID . '</MNT_ID>';
    echo '<MNT_TRANSACTION_ID>' . $transactionId . '</MNT_TRANSACTION_ID>';
    echo '<MNT_RESULT_CODE>500</MNT_RESULT_CODE>';
    echo '<MNT_SIGNATURE>' . md5('500' . $MNT_ID . $transactionId . $MNT_INTEGRITY_CODE) . '</MNT_SIGNATURE>';
    echo '</MNT_RESPONSE>';
    exit;
}

// ===== ОБНОВЛЯЕМ БАЛАНС В FIREBASE =====
// Используем Firebase REST API
function updateFirebaseBalance($userId, $amount) {
    $firebaseUrl = 'https://kyki-5e91a.firebaseio.com/';
    
    // Получаем текущий баланс
    $userUrl = $firebaseUrl . 'users/' . $userId . '.json';
    $ch = curl_init($userUrl);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    $response = curl_exec($ch);
    curl_close($ch);
    
    $userData = json_decode($response, true);
    $currentBalance = $userData['balance'] ?? 0;
    $newBalance = $currentBalance + $amount;
    
    // Обновляем баланс
    $updateUrl = $firebaseUrl . 'users/' . $userId . '/balance.json';
    $ch = curl_init($updateUrl);
    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'PUT');
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($newBalance));
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
    $result = curl_exec($ch);
    curl_close($ch);
    
    // Сохраняем транзакцию
    $transactionUrl = $firebaseUrl . 'transactions.json';
    $transactionData = [
        'userId' => $userId,
        'amount' => $amount,
        'description' => 'Пополнение баланса через PayAnyWay',
        'status' => 'completed',
        'createdAt' => date('c')
    ];
    $ch = curl_init($transactionUrl);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($transactionData));
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
    curl_exec($ch);
    curl_close($ch);
    
    file_put_contents('payanyway.log', "✅ Баланс обновлён: $userId +$amount -> $newBalance\n", FILE_APPEND);
    return true;
}

// ===== ОБНОВЛЯЕМ БАЛАНС =====
if ($userId) {
    updateFirebaseBalance($userId, (float)$amount);
}

// ===== ОТВЕЧАЕМ PAYANYWAY =====
header('Content-Type: application/xml');
echo '<?xml version="1.0" encoding="UTF-8"?>';
echo '<MNT_RESPONSE>';
echo '<MNT_ID>' . $MNT_ID . '</MNT_ID>';
echo '<MNT_TRANSACTION_ID>' . $transactionId . '</MNT_TRANSACTION_ID>';
echo '<MNT_RESULT_CODE>200</MNT_RESULT_CODE>';
echo '<MNT_SIGNATURE>' . md5('200' . $MNT_ID . $transactionId . $MNT_INTEGRITY_CODE) . '</MNT_SIGNATURE>';
echo '</MNT_RESPONSE>';

file_put_contents('payanyway.log', "✅ Ответ отправлен: 200\n", FILE_APPEND);
?>