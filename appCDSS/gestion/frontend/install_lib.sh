#!/bin/bash


cd flask-server
python3 -m venv venv
source venv/bin/activate
pip3 install pandas
pip3 install numpy
pip3 install scikit-learn
pip3 install Flask
pip3 install flask_cors
pip3 install matplotlib
pip3 install lifelines
pip3 install termcolor
pip3 install dtale
pip3 install mlxtend
pip3 install alive_progress