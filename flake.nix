{
  description = "Development environment for DuckPad";

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
            bun
            nodejs_24
          ];

          shellHook = ''
            echo "Welcome to DuckPad development environment"
            echo "Node.js version: $(node --version)"
            echo "Bun version: $(bun --version)"
          '';
        };
      }
    );
}
