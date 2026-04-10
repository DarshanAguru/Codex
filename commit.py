import subprocess
import sys
def run_command(command):
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

def generate_message():
    status = run_command("git status --short")
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
    
    message = f"{', '.join(all_files)}"
    if len(all_files) > 2:
        message += f" and {len(all_files) - 2} other files"
    
    return message

def main():
    print("1. Running build command...")
    output = run_command("npm run build")
    if not output:
        print("  --Build Failed")
        sys.exit(1)
    else:
        print("  --", "Printing build output:")
        for line in output.split("\n"):
            if "Successfully" in line:
                print("    --",line)
        print("  --","Build Successful")

    print("2. Staging all changes...")
    run_command("git add .")
    
    status = run_command("git status --short")
    if not status:
        print("No changes to commit.")
        return

    print("3. Generating commit message...")
    message = generate_message()

    print(f'4. Committing (with message): "{message}"')
    run_command(f'git commit -m "{message}"')
    
    print("5. Pushing to origin main...")
    run_command("git push -u origin main")
    
    print("6. Successfully committed and pushed!")

if __name__ == "__main__":
    main()
