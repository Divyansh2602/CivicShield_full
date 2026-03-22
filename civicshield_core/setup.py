from setuptools import setup, find_packages

setup(
    name="civicshield_core",
    version="0.1.2",
    packages=find_packages(),
    include_package_data=True,
    package_data={
        "civicshield_core": ["*.pkl"],
    },
    install_requires=[
        "requests",
        "beautifulsoup4",
        "dnspython",
        "scikit-learn",
        "joblib",
        "pandas",
        "reportlab",
        "click",
        "rich",
    ],
    entry_points={
        "console_scripts": [
            "civicshield=civicshield_core.cli:cli",
        ],
    },
)
