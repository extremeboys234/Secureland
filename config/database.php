<?php
declare(strict_types=1);

function securelandDatabaseConnection(): PDO
{
    $dsn = getenv('SECURELAND_DB_DSN');
    $dbUser = getenv('SECURELAND_DB_USER');
    $dbPassword = getenv('SECURELAND_DB_PASSWORD');

    if (
        $dsn === false ||
        trim($dsn) === '' ||
        $dbUser === false ||
        trim($dbUser) === '' ||
        $dbPassword === false
    ) {
        throw new PDOException('Required database environment variables are not configured.');
    }

    return new PDO($dsn, $dbUser, $dbPassword, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ]);
}
