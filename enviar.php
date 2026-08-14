<?php

declare(strict_types=1);

/* ===== Configuração ===== */
const CONTATO_DESTINO = 'alxteconsultoria@gmail.com';
const CONTATO_REMETENTE_NOME = 'Site ALX TEC SMART TI';
const CONTATO_REMETENTE_EMAIL = 'no-reply@seu-dominio.com.br';
const TEMPO_MINIMO_MS = 3000;
const LIMITE_ENVIOS = 5;
const JANELA_LIMITE_SEG = 3600;

function responder(bool $ok, string $msg, int $status = 200): void
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['ok' => $ok, 'message' => $msg], JSON_UNESCAPED_UNICODE);
    exit;
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    responder(false, 'Método não permitido.', 405);
}

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

/* Honeypot: campo escondido preenchido apenas por bots */
if (!empty($_POST['website'])) {
    responder(true, 'Mensagem enviada com sucesso! Entraremos em contato em breve.');
}

/* Time trap: formulário enviado rápido demais indica automação */
$decorrido = (int)post('decorrido');
if ($decorrido < TEMPO_MINIMO_MS) {
    responder(false, 'Envio inválido. Tente novamente.', 400);
}

/* Rate limit por sessão */
$agora = time();
if (!isset($_SESSION['contato_envios'])) {
    $_SESSION['contato_envios'] = [];
}
$_SESSION['contato_envios'] = array_values(array_filter(
    $_SESSION['contato_envios'],
    static function (int $t) use ($agora): bool {
        return $agora - $t < JANELA_LIMITE_SEG;
    }
));
if (count($_SESSION['contato_envios']) >= LIMITE_ENVIOS) {
    responder(false, 'Você já enviou várias mensagens. Aguarde um pouco e tente novamente.', 429);
}

function post(string $chave): string
{
    $valor = $_POST[$chave] ?? null;
    return is_string($valor) ? $valor : '';
}

function limpar(string $valor, int $max): string
{
    $valor = trim($valor);
    $valor = str_replace(["\r", "\n"], ' ', $valor);
    return cortar($valor, $max);
}

function cortar(string $valor, int $max): string
{
    if (function_exists('mb_substr')) {
        return mb_substr($valor, 0, $max);
    }
    return substr($valor, 0, $max);
}

$nome = limpar(post('nome'), 120);
$email = limpar(post('email'), 254);
$telefone = limpar(post('telefone'), 40);
$empresa = limpar(post('empresa'), 120);
$mensagem = trim(post('mensagem'));
$mensagem = cortar($mensagem, 3000);

if ($nome === '') {
    responder(false, 'Informe seu nome.', 422);
}
if ($email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    responder(false, 'Informe um e-mail válido.', 422);
}
if ($mensagem === '') {
    responder(false, 'Escreva sua mensagem.', 422);
}

$_SESSION['contato_envios'][] = $agora;

$linhas = [];
$linhas[] = 'Novo contato pelo site:';
$linhas[] = '';
$linhas[] = 'Nome: ' . $nome;
$linhas[] = 'E-mail: ' . $email;
if ($telefone !== '') {
    $linhas[] = 'Telefone: ' . $telefone;
}
if ($empresa !== '') {
    $linhas[] = 'Empresa: ' . $empresa;
}
$linhas[] = '';
$linhas[] = 'Mensagem:';
$linhas[] = $mensagem;
$corpo = implode("\n", $linhas);

$assunto = 'Contato pelo site - ' . $nome;
if (function_exists('mb_encode_mimeheader')) {
    $assunto = mb_encode_mimeheader($assunto, 'UTF-8');
}

$headers = implode("\r\n", [
    'From: ' . CONTATO_REMETENTE_NOME . ' <' . CONTATO_REMETENTE_EMAIL . '>',
    'Reply-To: ' . $email,
    'X-Mailer: PHP/' . phpversion(),
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=UTF-8',
]);

$enviado = @mail(CONTATO_DESTINO, $assunto, $corpo, $headers);

if ($enviado) {
    responder(true, 'Mensagem enviada com sucesso! Entraremos em contato em breve.');
}
responder(false, 'Não foi possível enviar sua mensagem agora. Tente novamente em instantes.', 500);
