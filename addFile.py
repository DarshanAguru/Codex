import sys
import os

def addFile(name):
    name = name.lower()
    name = name.replace(" ", "_")
    name = name.replace("-", "_")
    name = name[0].upper() + name[1:]
    files = os.listdir("dsa")
    if f"{name}.txt" in files:
        print(f"File {name}.txt already exists")
        return    
    with open(f"dsa/{name}.txt", "w") as f:
        f.write("")
    print(f"Created file: dsa/{name}.txt")

if __name__ == "__main__":
    if(len(sys.argv) < 2):
        print("Usage: python addFile.py <problem name>")
    else:
        addFile(" ".join(sys.argv[1:]))