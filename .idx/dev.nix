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
    "flake8rt.flake8"
  ];
  idx.previews = {
    previews = {
      web = {
        command = [
          "yarn"
          "docs:dev"
          "--port"
          "$PORT"
          "--host"
          "0.0.0.0"
        ];
        manager = "web";
      };
    };
  };
}