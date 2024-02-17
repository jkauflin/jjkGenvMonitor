echo "Clearing service logs..."
sudo journalctl --vacuum-time=1s
sudo journalctl --flush --rotate
sudo sleep 2
sudo journalctl --vacuum-time=1s
sudo journalctl --flush --rotate
