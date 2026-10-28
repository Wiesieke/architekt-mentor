<?php
declare(strict_types=1);
/** ArchitectMentor Desk — private LH.pl PHP front controller, no external auth service. */
require_once __DIR__.'/auth.php';
try{amd_boot();}catch(Throwable $e){
 error_log('ArchitectMentor desk setup: '.get_class($e));
 http_response_code(503);exit('Panel chwilowo niedostępny. Sprawdź prywatną konfigurację LH.pl.');
}
header('Content-Type: text/html; charset=utf-8');
$method=(string)($_SERVER['REQUEST_METHOD']??'GET');
if(!in_array($method,['GET','POST'],true)){http_response_code(405);exit('Method not allowed');}
$error='';$notice='';$revealSecret='';$csrf=amd_csrf();
$state=amd_state();
$configured=strlen(amd_setup_token())>=32;
if(!$configured){http_response_code(503);exit('Brak bezpiecznego AM_DESK_SETUP_TOKEN w prywatnej konfiguracji.');}
function amd_go(): never {header('Location: index.php',true,303);exit;}
if($method==='POST'){
 if(!amd_check_csrf()){http_response_code(403);exit('Sesja wygasła. Odśwież stronę.');}
 $mode=(string)($_POST['mode']??'');
 $token=(string)($_POST['setup_token']??'');
 $setupOk=strlen($token)>=32&&strlen($token)<=256&&hash_equals(amd_setup_token(),$token);
 if($mode==='install'&&$state===null){
  if(!amd_rate('check'))$error='Zbyt wiele prób. Wróć za 30 minut.';
  elseif(!$setupOk){amd_rate('fail');$error='Niepoprawny klucz instalacyjny.';}
  else{
   $username=trim((string)($_POST['username']??''));
   $password=(string)($_POST['password']??'');
   if(!preg_match('/^[A-Za-z0-9._-]{3,40}$/D',$username))$error='Login musi mieć 3–40 znaków (litery, cyfry, kropka, myślnik).';
   elseif(strlen($password)<14||strlen($password)>200)$error='Hasło musi mieć od 14 do 200 bajtów.';
   else {
    $algo=defined('PASSWORD_ARGON2ID')?PASSWORD_ARGON2ID:PASSWORD_DEFAULT;
    if($algo===PASSWORD_DEFAULT&&strlen($password)>72)$error='Na tym serwerze hasło może mieć najwyżej 72 bajty.';
    else{
     $secret=amd_b32_encode(random_bytes(20));
     $hash=password_hash($password,$algo);
     amd_create_state(['username'=>$username,'password_hash'=>$hash,'totp_secret'=>$secret,
       'last_step'=>-1,'verified'=>false,'created_at_utc'=>gmdate('c')]);
     $state=amd_state();$revealSecret=$secret;
     amd_rate('reset');$notice='Konto utworzone. Dodaj klucz do aplikacji Authenticator i potwierdź kodem.';
    }
   }
  }
 }elseif($mode==='reveal'&&$state!==null&&$state['verified']===false){
  if(!amd_rate('check'))$error='Zbyt wiele prób. Wróć za 30 minut.';
  elseif(!$setupOk){amd_rate('fail');$error='Niepoprawny klucz instalacyjny.';}
  else{$revealSecret=(string)$state['totp_secret'];$notice='Wpisz klucz w aplikacji Authenticator, następnie potwierdź kod.';}
 }elseif($mode==='confirm'&&$state!==null&&$state['verified']===false){
  if(!amd_rate('check'))$error='Zbyt wiele prób. Wróć za 30 minut.';
  elseif(!$setupOk){amd_rate('fail');$error='Niepoprawny klucz instalacyjny.';}
  else{
   $step=amd_totp_step((string)$state['totp_secret'],(string)($_POST['otp']??''),time(),(int)($state['last_step']??-1));
   if($step===null||!amd_consume_totp($step,true)){amd_rate('fail');$error='Niepoprawny kod. Sprawdź czas w telefonie.';}
   else{amd_rate('reset');amd_go();}
  }
 }elseif($mode==='login'&&$state!==null&&($state['verified']??false)===true){
  if(!amd_rate('check'))$error='Zbyt wiele prób. Wróć za 30 minut.';
  else{
   $username=(string)($_POST['username']??'');$password=(string)($_POST['password']??'');
   $otp=(string)($_POST['otp']??'');
   $goodName=hash_equals((string)$state['username'],$username);
   $goodPassword=password_verify($password,(string)$state['password_hash']);
   $step=($goodName&&$goodPassword)?
     amd_totp_step((string)$state['totp_secret'],$otp,time(),(int)($state['last_step']??-1)):null;
   if($step===null||!amd_consume_totp($step,false)){
    amd_rate('fail');$error='Niepoprawny login, hasło lub kod.';
   }else{amd_rate('reset');amd_set_login($username);amd_go();}
  }
 }elseif($mode==='logout'&&amd_auth_valid()){amd_logout();amd_go();}
 else{$error='Operacja jest niedostępna. Odśwież stronę.';}
}
$logged=$state!==null&&($state['verified']??false)===true&&amd_auth_valid();
?><!doctype html>
<html lang="pl">
<head>
 <meta charset="utf-8">
 <meta name="viewport" content="width=device-width,initial-scale=1">
 <meta name="robots" content="noindex,nofollow,noarchive">
 <meta name="am-desk-csrf" content="<?=amd_esc($csrf)?>">
 <title>ArchitectMentor · prywatny Desk</title>
 <link rel="stylesheet" href="app.css">
 <?php if($logged):?><script src="app.js" defer></script><?php endif;?>
</head>
<body>
<?php if(!$logged):?>
 <main class="gate"><section class="gate-card">
  <p class="eyebrow">ARCHITECTMENTOR / PRIVATE</p>
  <h1><?=($state===null?'Pierwsza konfiguracja':(($state['verified']??false)?'Zaloguj się':'Potwierdź Authenticator'))?></h1>
  <p class="muted">Prywatny panel decyzji. Treści nie są publikowane automatycznie.</p>
  <?php if($error!==''):?><div class="alert error" role="alert"><?=amd_esc($error)?></div><?php endif;?>
  <?php if($notice!==''):?><div class="alert" role="status"><?=amd_esc($notice)?></div><?php endif;?>
  <?php if($state===null):?>
   <p class="muted">Wpisz klucz instalacyjny z prywatnej konfiguracji LH.pl, nowy login i silne hasło. Instalacja może być wykonana tylko raz.</p>
   <form method="post" action="index.php" autocomplete="off">
    <input type="hidden" name="mode" value="install"><input type="hidden" name="csrf" value="<?=amd_esc($csrf)?>">
    <label>Klucz instalacyjny<input name="setup_token" type="password" required minlength="32" autocomplete="off"></label>
    <label>Nowy login<input name="username" type="text" required minlength="3" maxlength="40" autocomplete="off" value="wiesiek"></label>
    <label>Nowe silne hasło<input name="password" type="password" required minlength="14" autocomplete="new-password"></label>
    <button type="submit">Utwórz konto</button>
   </form>
  <?php elseif(($state['verified']??false)===false):?>
   <?php if($revealSecret!==''):?>
    <p class="muted">W aplikacji Authenticator wybierz „Dodaj konto” → „Wpisz klucz konfiguracji”. Typ: czasowy (TOTP), 6 cyfr.</p>
    <div class="totp-secret" aria-label="Tajny klucz Authenticator"><?=amd_esc($revealSecret)?></div>
    <p class="muted">Zapisz ten klucz bezpiecznie poza komputerem. Nie wysyłaj go nikomu.</p>
   <?php endif;?>
   <form method="post" action="index.php" autocomplete="off">
    <input type="hidden" name="mode" value="<?=($revealSecret!==''?'confirm':'reveal')?>">
    <input type="hidden" name="csrf" value="<?=amd_esc($csrf)?>">
    <label>Klucz instalacyjny<input name="setup_token" type="password" required minlength="32" autocomplete="off"></label>
    <?php if($revealSecret!==''):?>
     <label>Sześciocyfrowy kod z Authenticatora<input name="otp" inputmode="numeric" autocomplete="one-time-code" pattern="[0-9]{6}" required maxlength="6"></label>
     <button type="submit">Potwierdź konfigurację</button>
    <?php else:?><button type="submit">Pokaż klucz Authenticatora</button><?php endif;?>
   </form>
  <?php else:?>
   <form method="post" action="index.php">
    <input type="hidden" name="mode" value="login"><input type="hidden" name="csrf" value="<?=amd_esc($csrf)?>">
    <label>Login<input name="username" type="text" required autocomplete="username"></label>
    <label>Hasło<input name="password" type="password" required autocomplete="current-password"></label>
    <label>Kod z aplikacji Authenticator<input name="otp" inputmode="numeric" autocomplete="one-time-code" pattern="[0-9]{6}" required maxlength="6"></label>
    <button type="submit">Zaloguj się</button>
   </form>
  <?php endif;?>
  <small class="muted">Połączenie HTTPS · sesja wygasa po 30 minutach bezczynności</small>
 </section></main>
<?php else:?>
 <header class="topbar">
  <a class="wordmark" href="index.php">ARCHITECTMENTOR <b>DESK</b></a>
  <form method="post" action="index.php"><input type="hidden" name="mode" value="logout"><input type="hidden" name="csrf" value="<?=amd_esc($csrf)?>"><button class="quiet" type="submit">Wyloguj się</button></form>
 </header>
 <main class="shell">
  <section class="intro"><div><p class="eyebrow">ARCHITEKTURA W RUCHU / PRIVATE REVIEW</p><h1>Radar decyzji</h1><p>Materiały z radaru są kandydatami do analizy, a nie zweryfikowanymi wiadomościami. Decyzja nie powoduje publikacji.</p></div><button class="quiet" type="button" id="reload">Odśwież dane</button></section>
  <div class="alert hidden" id="global-alert" role="alert"></div>
  <section class="stats"><div><small>Pozycje w radarze</small><strong id="metric-total">—</strong></div><div><small>Wybrane do analizy</small><strong id="metric-selected">—</strong></div><div><small>Ostatnie pobranie UTC</small><strong id="metric-last" class="date">—</strong></div></section>
  <div class="workspace">
   <section class="queue"><header><h2>Kolejka materiałów <span id="queue-count"></span></h2><p>Dane z wydzielonej bazy ArchitectMentor</p></header>
    <div class="filters"><input id="search" placeholder="Szukaj tematu lub źródła" aria-label="Szukaj materiału"><select id="filter" aria-label="Filtr decyzji">
     <option value="all">Wszystkie decyzje</option><option value="UNREVIEWED">Bez decyzji</option><option value="SELECTED">Wybrane</option><option value="HOLD">Odłożone</option><option value="REQUEST_RESEARCH">Do sprawdzenia</option><option value="REJECTED">Odrzucone</option>
    </select></div><div class="itemlist" id="itemlist"><p class="muted">Trwa wczytywanie…</p></div>
   </section>
   <section class="editor" id="editor"><p class="muted">Wybierz materiał z kolejki.</p></section>
  </div>
  <footer>ArchitectMentor Radar · panel wewnętrzny · <span id="sources-count">—</span> aktywnych źródeł</footer>
 </main>
<?php endif;?>
</body></html>
