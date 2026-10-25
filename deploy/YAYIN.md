# Konum — Yayına Alma Kılavuzu (app.askthousand.com)

Bu kılavuz, Konum'un davetli pilotunun app.askthousand.com altında yayına alınması için gereken
adımları sıralar. Hedef mimari: küçük VPS (Ubuntu) + Caddy (otomatik HTTPS) + systemd servisi +
gecelik SQLite yedeği. Tahmini maliyet: ~6$/ay (Hetzner CX11 veya eşdeğeri).

## 1. Sunucu (bir kere)

1. Hetzner/Render benzeri bir Ubuntu 24.04 VPS aç (1 vCPU / 2 GB yeter).
2. DNS: `app.askthousand.com` için A kaydı → sunucunun IPv4 adresi. (Yayılma 5-30 dk.)
3. Sunucuda:
   ```sh
   sudo apt update && sudo apt install -y nodejs npm caddy sqlite3
   sudo useradd -r -m -d /opt/konum -s /bin/bash konum || true
   sudo mkdir -p /opt/konum && sudo chown konum:konum /opt/konum
   ```

## 2. Uygulamanın kurulması

```sh
sudo -u konum git clone <repo-url> /opt/konum/app
cd /opt/konum/app
sudo -u konum npm ci
sudo -u konum npm run build
```

Çalıştırma: `server/` Express-Hono uygulaması Vite build çıktısını statik olarak sunar
(tek süreç yeter; ayrı frontend sunucusu yok).

## 3. Ortam değişkenleri (/opt/konum/app/.env)

```
KONUM_ENV=production
KONUM_PLATFORM_SAHIBI=cem@aiworkschool.com
PORT=3000
# ANTHROPIC_API_KEY buraya YAZILMAZ — Ayarlar ekranından girilir, ~/.konum/secrets.json'a düşer
```

## 4. systemd servisi (/etc/systemd/system/konum.service)

```
[Unit]
Description=Konum
After=network.target

[Service]
User=konum
WorkingDirectory=/opt/konum/app
EnvironmentFile=/opt/konum/app/.env
ExecStart=/usr/bin/npm start
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

```sh
sudo systemctl enable --now konum
```

## 5. Caddy (otomatik HTTPS) — /etc/caddy/Caddyfile

```
app.askthousand.com {
    reverse_proxy 127.0.0.1:3000
}
```

```sh
sudo systemctl reload caddy
```

Caddy sertifikayı kendisi alır ve yeniler. KONUM_ENV=production olduğu için oturum çerezi
yalnız HTTPS üzerinden taşınır.

## 6. Yedekleme

```sh
sudo -u konum crontab -e
# 0 4 * * * /opt/konum/app/scripts/yedekle.sh
```

14 günlük geriye dönük yedek tutulur (veritabanı + gizli dosyalar).

## 7. Yayın öncesi son kontrol listesi

- [ ] `curl https://app.askthousand.com/health` → {"ok":true}
- [ ] Giriş sayfası HTTPS'te açılıyor, çerez DevTools'ta `Secure` bayraklı
- [ ] Yanlış davet kodu 11 kez denenince 429 dönüyor
- [ ] Yeni davet, Konsol ekranından üretiliyor (tohum davet yalnızca ilk kurulumda)
- [ ] Yedek betiği elle bir kez çalıştırıldı ve dosya oluştu
- [ ] Landing'de /privacy ve /terms açılıyor
