"""Builds the buyer portal (buyers.html) from its template. Buyers sign in with the code on their Buyer Pass."""
import os
R = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
API = 'https://script.google.com/macros/s/AKfycbz0ALnuwyuwKaRkr2sGS7N_TPJ3DIXYYRiLP7RiNlBvv5HfQMxfy82jS88ihRab7Duu/exec'
out = open(os.path.join(R, 'source/public-site/buyers.template.html')).read().replace('__API__', API)
open(os.path.join(R, 'buyers.html'), 'w').write(out)
print('buyers.html built')
