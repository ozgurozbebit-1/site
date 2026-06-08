# Admin Panel Kurulumu

Admin panel Vercel üzerinde `/admin` adresinde çalışır. GitHub tokenı yalnızca Vercel server-side fonksiyonlarında kullanılır ve tarayıcıya gönderilmez.

## 1. GitHub

1. Site dosyalarını bir GitHub deposuna yükleyin.
2. Fine-grained personal access token oluşturun.
3. Tokenı yalnızca bu depoyla sınırlandırın.
4. Repository permissions bölümünde `Contents: Read and write` yetkisi verin.
5. Güncellemelerin doğrudan yapılacağı branch `main` olmalıdır.

Branch koruması doğrudan commit atılmasını engelliyorsa admin yayını başarısız olur. Bu durumda tokenın branch'e yazmasına izin verilmelidir.

## 2. Vercel Environment Variables

Vercel projesinde aşağıdaki değişkenleri Production ortamına ekleyin:

```text
GITHUB_TOKEN
GITHUB_OWNER
GITHUB_REPO
GITHUB_BRANCH=main
ADMIN_PASSWORD
ADMIN_SESSION_SECRET
VERCEL_DEPLOYMENTS_URL
```

- `ADMIN_PASSWORD` en az 12 karakter olmalıdır.
- `ADMIN_SESSION_SECRET` en az 32 karakterlik rastgele bir değer olmalıdır.
- `VERCEL_DEPLOYMENTS_URL`, admin panelindeki dağıtım kontrol düğmesinin açacağı Vercel proje bağlantısıdır. Eklenmezse genel Vercel paneli açılır.
- Bu değerleri HTML, JavaScript veya GitHub deposuna yazmayın.

## 3. Yayın Akışı

1. `/admin` adresinde oturum açın.
2. İletişim alanlarını düzenleyin.
3. `Önizle` düğmesine basın.
4. Önizlemeyi ve etkilenecek dosyaları kontrol edin.
5. Onay kutusunu işaretleyip `Yayınla` düğmesine basın.

Panel bütün HTML dosyalarını GitHub'dan yeniden okur, iletişim verilerini ve Physician JSON-LD şemasını günceller, ardından dosyaları tek commit ile `main` branch'ine gönderir. Vercel bu commit sonrasında otomatik dağıtım başlatır.
