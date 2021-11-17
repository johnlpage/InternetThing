Start an AWS host - I used a T3 small 2GB/2CPU 8GB Disk
allow 8181-8183 through and port 80 if getting a cert

Install Mongosh

```
cat << 'ENDOFDOC' |  sudo tee /etc/yum.repos.d/mongodb-enterprise.repo
[mongodb-org-5.0]
name=MongoDB Repository
baseurl=https://repo.mongodb.org/yum/amazon/2/mongodb-org/5.0/x86_64/
gpgcheck=1
enabled=1
gpgkey=https://www.mongodb.org/static/pgp/server-5.0.asc
ENDOFDOC

sudo yum install -y mongodb-mongosh 
```


Regisster in DBS


curl --silent "https://us-east-1.aws.webhooks.mongodb-stitch.com/api/client/v2.0/app/registertrainingdns-kcqpc/service/webhook/incoming_webhook/register_with_owner?hostname=oademo.mdbtraining.net&ip=$(curl ifconfig.me)&secret=fluffypup&owner=john.page"


Install shellinabox
```
sudo mkdir -p /opt/shellinaboxd
cd /opt/shellinaboxd
sudo curl --silent -OL https://mdb-strigio.s3.eu-central-1.amazonaws.com/shellinaboxd
sudo chmod a+x /opt/shellinaboxd/shellinaboxd
```
Start
Mongosh endpoints

```

/opt/shellinaboxd/shellinaboxd -b -p 8281 --service=:ec2-user:ec2-user:HOME:'mongosh "mongodb+srv://demoview:testing123@internetthing2.tzfdn.mongodb.net/blescan"'

/opt/shellinaboxd/shellinaboxd -b -p 8282 --service=:ec2-user:ec2-user:HOME:'mongosh "mongodb://archived-atlas-online-archive-618d29f61160e771b36cf8de-tzfdn.a.query.mongodb.net/blescan" --tls --authenticationDatabase admin --username demoview --password testing123'

/opt/shellinaboxd/shellinaboxd -b -p 8283 --service=:ec2-user:ec2-user:HOME:'mongosh "mongodb://atlas-online-archive-618d29f61160e771b36cf8de-tzfdn.a.query.mongodb.net/blescan" --tls --authenticationDatabase admin --username demoview --password testing123'

curl --silent "https://us-east-1.aws.webhooks.mongodb-stitch.com/api/client/v2.0/app/registertrainingdns-kcqpc/service/webhook/incoming_webhook/register_with_owner?hostname=oademo.mdbtraining.net&ip=$(curl ifconfig.me)&secret=fluffypup&owner=john.page"



```

sudo amazon-linux-extras install nginx1
cd /etc/nginx
sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 -keyout /etc/nginx/cert.key -out /etc/nginx/cert.crt


cat << 'ENDOFDOC' |  sudo tee /etc/nginx/nginx.conf
# For more information on configuration, see:
#   * Official English Documentation: http://nginx.org/en/docs/
#   * Official Russian Documentation: http://nginx.org/ru/docs/

user nginx;
worker_processes auto;
error_log /var/log/nginx/error.log;
pid /run/nginx.pid;

# Load dynamic modules. See /usr/share/doc/nginx/README.dynamic.
include /usr/share/nginx/modules/*.conf;

events {
    worker_connections 1024;
}

http {
    log_format  main  '$remote_addr - $remote_user [$time_local] "$request" '
                      '$status $body_bytes_sent "$http_referer" '
                      '"$http_user_agent" "$http_x_forwarded_for"';

    access_log  /var/log/nginx/access.log  main;

    sendfile            on;
    tcp_nopush          on;
    tcp_nodelay         on;
    keepalive_timeout   65;
    types_hash_max_size 4096;

    include             /etc/nginx/mime.types;
    default_type        application/octet-stream;

    # Load modular configuration files from the /etc/nginx/conf.d directory.
    # See http://nginx.org/en/docs/ngx_core_module.html#include
    # for more information.
    include /etc/nginx/conf.d/*.conf;

    server {
        listen       80;
        listen       [::]:80;
        server_name  _;
        root         /usr/share/nginx/html;

        # Load configuration files for the default server block.
        include /etc/nginx/default.d/*.conf;

        error_page 404 /404.html;
        location = /404.html {
        }

        error_page 500 502 503 504 /50x.html;
        location = /50x.html {
        }
    }

server {

    listen 8181;
    server_name oademo.mdbtraining.com;

    ssl_certificate           /etc/nginx/cert.crt;
    ssl_certificate_key       /etc/nginx/cert.key;

    ssl on;
    ssl_session_cache  builtin:1000  shared:SSL:10m;
    ssl_protocols  TLSv1 TLSv1.1 TLSv1.2;
    ssl_ciphers HIGH:!aNULL:!eNULL:!EXPORT:!CAMELLIA:!DES:!MD5:!PSK:!RC4;
    ssl_prefer_server_ciphers on;

    access_log            /var/log/nginx/jenkins.access.log;

    location / {

      proxy_set_header        Host $host;
      proxy_set_header        X-Real-IP $remote_addr;
      proxy_set_header        X-Forwarded-For $proxy_add_x_forwarded_for;
      proxy_set_header        X-Forwarded-Proto $scheme;

      # Fix the “It appears that your reverse proxy set up is broken" error.
      proxy_pass          http://localhost:8281;
      proxy_read_timeout  90;

      proxy_redirect      http://localhost:8281 https://oademo.mdbtraining.com:8181;
    }
  }

  server {

    listen 8182;
    server_name oademo.mdbtraining.com;

    ssl_certificate           /etc/nginx/cert.crt;
    ssl_certificate_key       /etc/nginx/cert.key;

    ssl on;
    ssl_session_cache  builtin:1000  shared:SSL:10m;
    ssl_protocols  TLSv1 TLSv1.1 TLSv1.2;
    ssl_ciphers HIGH:!aNULL:!eNULL:!EXPORT:!CAMELLIA:!DES:!MD5:!PSK:!RC4;
    ssl_prefer_server_ciphers on;

    access_log            /var/log/nginx/jenkins.access.log;

    location / {

      proxy_set_header        Host $host;
      proxy_set_header        X-Real-IP $remote_addr;
      proxy_set_header        X-Forwarded-For $proxy_add_x_forwarded_for;
      proxy_set_header        X-Forwarded-Proto $scheme;

      # Fix the “It appears that your reverse proxy set up is broken" error.
      proxy_pass          http://localhost:8282;
      proxy_read_timeout  90;

      proxy_redirect      http://localhost:8282 https://oademo.mdbtraining.com:8182;
    }
  }

  server {

    listen 8183;
    server_name oademo.mdbtraining.com;

    ssl_certificate           /etc/nginx/cert.crt;
    ssl_certificate_key       /etc/nginx/cert.key;

    ssl on;
    ssl_session_cache  builtin:1000  shared:SSL:10m;
    ssl_protocols  TLSv1 TLSv1.1 TLSv1.2;
    ssl_ciphers HIGH:!aNULL:!eNULL:!EXPORT:!CAMELLIA:!DES:!MD5:!PSK:!RC4;
    ssl_prefer_server_ciphers on;

    access_log            /var/log/nginx/jenkins.access.log;

    location / {

      proxy_set_header        Host $host;
      proxy_set_header        X-Real-IP $remote_addr;
      proxy_set_header        X-Forwarded-For $proxy_add_x_forwarded_for;
      proxy_set_header        X-Forwarded-Proto $scheme;

      # Fix the “It appears that your reverse proxy set up is broken" error.
      proxy_pass          http://localhost:8283;
      proxy_read_timeout  90;

      proxy_redirect      http://localhost:8283 https://oademo.mdbtraining.com:8183;
    }
  }

}
ENDOFDOC

sudo yum install -y https://dl.fedoraproject.org/pub/epel/epel-release-latest-7.noarch.rpm
sudo yum-config-manager --enable epel
sudo yum install certbot
sudo certbot certonly --standalone -d mdbtraining.com

sudo certbot certonly --standalone -d oademo.mdbtraining.net

cat /etc/letsencrypt/live/oademo.mdbtraining.net/cert.pem /etc/letsencrypt/live/oademo.mdbtraining.net/chain.pem > /etc/nginx/cert.crt
cp /etc/letsencrypt/live/oademo.mdbtraining.net/privkey.pem  /etc/nginx/cert.key


Set these thins to happen on reboot too (TODO - ignore for now)
```
sudo chmod +x /etc/rc.d/rc.local

grep shellinaboxd /etc/rc.local  || echo "/opt/shellinaboxd/shellinaboxd -b -p 80 -s :SSH" | sudo tee --append /etc/rc.local

echo 'curl --silent "https://us-east-1.aws.webhooks.mongodb-stitch.com/api/client/v2.0/app/registertrainingdns-kcqpc/service/webhook/incoming_webhook/register_with_owner?hostname=oademo.mdbtraining.net&ip=$(curl ifconfig.me)&secret=fluffypup&owner=john.page" ' | sudo tee --append /etc/rc.local
```





