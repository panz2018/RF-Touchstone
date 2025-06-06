{pkgs}: {
  channel = "stable-24.05";
  packages = [
    pkgs.nodejs_22
  ];
  idx.extensions = [
    "vue.volar"
    "ms-python.black-formatter"
    "esbenp.prettier-vscode"
    "ms-python.python"
    "ms-python.debugpy"
    "ms-toolsai.jupyter"
    "ms-python.flake8"
    "yandeu.five-server"
  ];

  # Enable previews and customize configuration
  idx.previews = {
    enable = true;
  };
}