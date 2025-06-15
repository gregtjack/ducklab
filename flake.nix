{
  description = "Development environment for DuckLab";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = nixpkgs.legacyPackages.${system};
      in
      {
        devShells.default = pkgs.mkShell {
          buildInputs = with pkgs; [
            # Node.js and Bun
            nodejs_22
            bun
          ];

          shellHook = ''
            echo "🚀 Welcome to DuckLab development environment!"
            echo "📦 Node.js version: $(node --version)"
            echo "🐰 Bun version: $(bun --version)"
            echo "📝 TypeScript version: $(tsc --version)"
          '';
        };
      }
    );
}
