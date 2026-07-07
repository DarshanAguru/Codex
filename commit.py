import subprocess
import sys
def run_command(command: str) -> str | None:
    try:
        result = subprocess.run(command, shell=True, check=True, text=True, capture_output=True)
        return result.stdout.strip()
    except subprocess.CalledProcessError as e:
        if "nothing to commit" in e.stderr:
            return None
        if "Build failed" in e.stderr:
            return None
        print(f"Error running command: {e.cmd}")
        print(f"Error output: {e.stderr}")
        sys.exit(1)

def generate_message(status: str) -> str:
    status_list = status.split("\n")
    
    all_files = []
    for file in status_list:
        if file:
            if file.startswith("A"):
                all_files.append(f"Added {file.split(" ")[-1]}")
            elif file.startswith("M"):
                all_files.append(f"Modified {file.split(" ")[-1]}")
    if not all_files:
        return "Minor updates"
    
    if len(all_files) <= 2:
        return f"{', '.join(all_files)}"
    else:
        return f"{', '.join(all_files[:2])} & {len(all_files) - 2} more"

def betterPrint(text: str, lev: int = 1, ptr: str = "") -> None:
    print_text = "\t" * (lev - 1)
    if ptr.strip() != "":
        print_text += f"{ptr} "
    print_text += text
    print(print_text)


def main() -> None:
    betterPrint("Running build command...",ptr="1.")
    output = run_command("npm run build")
    if not output:
        betterPrint("Build Failed", lev=2, ptr="-")
        sys.exit(1)
    else:
        betterPrint("Printing build output:", lev = 2, ptr = "-")
        for line in output.split("\n"):
            if "Successfully" in line:
                betterPrint(line, lev=3, ptr="--")
        betterPrint("Build Successful", lev = 2, ptr="-")

    betterPrint("Staging all changes...", ptr="2.")
    run_command("git add .")
    
    status = run_command("git status --short")
    if not status:
        betterPrint("No changes to commit.", lev=2, ptr="-")
        return

    betterPrint("Generating commit message...", ptr="3.")
    message = generate_message(status)

    betterPrint(f'Committing (with message): "{message}"', ptr="4.")
    run_command(f'git commit -m "{message}"')
    
    betterPrint("Pushing to origin main...", ptr="5.")
    run_command("git push -u origin main")
    
    betterPrint("Successfully committed and pushed!", ptr="6.")

if __name__ == "__main__":
    main()
