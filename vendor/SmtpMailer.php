<?php

declare(strict_types=1);

class SmtpMailer
{
    private $host;
    private $port;
    private $user;
    private $pass;
    private $crypto;
    private $ehloHost;
    private $stream = null;

    public function __construct(
        string $host,
        int $port,
        string $user,
        string $pass,
        string $crypto = 'tls',
        string $ehloHost = ''
    ) {
        $this->host     = $host;
        $this->port     = $port;
        $this->user     = $user;
        $this->pass     = $pass;
        $this->crypto   = $crypto;
        $this->ehloHost = $ehloHost ?: (gethostname() ?: 'localhost');
    }

    public function send(
        string $fromEmail,
        string $toEmail,
        string $subject,
        string $body,
        string $fromName = '',
        string $replyToEmail = '',
        string $replyToName = ''
    ) {
        try {
            $this->connect();
            $this->ehlo();
            if ($this->crypto === 'tls') {
                $this->startTls();
                $this->ehlo();
            }
            $this->auth();
            $this->mailFrom($fromEmail);
            $this->rcptTo($toEmail);
            $this->data($fromEmail, $toEmail, $subject, $body, $fromName, $replyToEmail, $replyToName);
            $this->quit();
        } finally {
            $this->disconnect();
        }
    }

    private function connect():
    {
        $target = $this->crypto === 'ssl'
            ? 'ssl://' . $this->host . ':' . $this->port
            : $this->host . ':' . $this->port;

        $errno  = 0;
        $errstr = '';
        $this->stream = @stream_socket_client($target, $errno, $errstr, 30);
        if (!$this->stream) {
            throw new RuntimeException('Falha na conexão SMTP: ' . $errstr, $errno);
        }
        stream_set_timeout($this->stream, 30);
        $this->expect(220);
    }

    private function ehlo():
    {
        $this->write('EHLO ' . $this->ehloHost);
        $this->expect(250);
    }

    private function startTls():
    {
        $this->write('STARTTLS');
        $this->expect(220);
        $ok = @stream_socket_enable_crypto($this->stream, true, STREAM_CRYPTO_METHOD_TLS_CLIENT);
        if (!$ok) {
            throw new RuntimeException('Falha ao iniciar sessão TLS');
        }
    }

    private function auth():
    {
        $this->write('AUTH LOGIN');
        $this->expect(334);
        $this->write(base64_encode($this->user));
        $this->expect(334);
        $this->write(base64_encode($this->pass));
        $this->expect(235);
    }

    private function mailFrom(string $email):
    {
        $this->write('MAIL FROM:<' . $email . '>');
        $this->expect(250);
    }

    private function rcptTo(string $email):
    {
        $this->write('RCPT TO:<' . $email . '>');
        $this->expect(250);
    }

    private function data(
        string $fromEmail,
        string $toEmail,
        string $subject,
        string $body,
        string $fromName,
        string $replyToEmail,
        string $replyToName
    ) {
        $this->write('DATA');
        $this->expect(354);

        $fromHeader = $fromName !== ''
            ? '"' . str_replace(['"', "\r", "\n"], '', $fromName) . '" <' . $fromEmail . '>'
            : $fromEmail;

        $headers = [
            'From: ' . $fromHeader,
            'To: ' . $toEmail,
            'Subject: ' . $subject,
            'Date: ' . date('r'),
            'MIME-Version: ' . '1.0',
            'Content-Type: text/plain; charset=UTF-8',
            'Content-Transfer-Encoding: 8bit',
            'X-Mailer: SmtpMailer/1.0',
        ];

        if ($replyToEmail !== '') {
            $replyHeader = $replyToName !== ''
                ? '"' . str_replace(['"', "\r", "\n"], '', $replyToName) . '" <' . $replyToEmail . '>'
                : $replyToEmail;
            $headers[] = 'Reply-To: ' . $replyHeader;
        }

        $message = implode("\r\n", $headers) . "\r\n\r\n" . $body . "\r\n.";
        $this->write($message);
        $this->expect(250);
    }

    private function quit():
    {
        try {
            $this->write('QUIT');
            $this->expect(221);
        } catch (RuntimeException $e) {
            // QUIT failure is non-critical
        }
    }

    private function disconnect():
    {
        if (is_resource($this->stream)) {
            fclose($this->stream);
        }
        $this->stream = null;
    }

    private function write(string $data):
    {
        $len = strlen($data);
        $written = 0;
        while ($written < $len) {
            $chunk = @fwrite($this->stream, substr($data, $written), 8192);
            if ($chunk === false || $chunk === 0) {
                throw new RuntimeException('Erro ao escrever no socket SMTP');
            }
            $written += $chunk;
        }
    }

    private function expect(int $code):
    {
        $line = @fgets($this->stream, 4096);
        if ($line === false) {
            throw new RuntimeException('Resposta SMTP inválida');
        }
        while (strlen($line) > 4 && $line[3] === '-') {
            $line = @fgets($this->stream, 4096);
            if ($line === false) {
                break;
            }
        }
        $respCode = (int) substr($line, 0, 3);
        if ($respCode !== $code) {
            throw new RuntimeException('Erro SMTP (' . $respCode . '): ' . trim($line), $respCode);
        }
    }
}
