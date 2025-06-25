import os
import subprocess
import tkinter as tk

# Global variables to store subprocesses
processes = {
    "frontend": [],
    "database": []
}

# Track button clicks
button_clicked = {
    "frontend": False,
    "database": False
}

def start_frontend():
    """Start npm, node server.js, and python app.py in the frontend folder."""
    if button_clicked["frontend"]:
        return

    frontend_dir = os.path.join(os.getcwd(), r'frontend')
    backend_dir = os.path.join(os.getcwd(), r'backend')
    screens_dir = os.path.join(frontend_dir, 'src', 'Screens')

    # Run 'npm start' in a new command prompt
    npm_start_proc = subprocess.Popen('start cmd /k npm start', cwd=frontend_dir, shell=True)
    processes['frontend'].append(npm_start_proc)

    # Run 'node server.js' in a new command prompt
    server_proc = subprocess.Popen('start cmd /k npm start', cwd=backend_dir, shell=True)
    processes['frontend'].append(server_proc)

    # Display confirmation label
    label.config(text="Frontend started.")
    
    # Disable button after click
    frontend_button.config(state=tk.DISABLED)
    button_clicked["frontend"] = True

def start_database():
    """Start node server.js in the database folder."""
    if button_clicked["database"]:
        return

    database_dir = os.path.join(os.getcwd(), r'radiology frontend\src\Screens\Database')

    # Run 'node server.js' in a new command prompt
    server_proc = subprocess.Popen('start cmd /k node server.js', cwd=database_dir, shell=True)
    processes['database'].append(server_proc)

    # Display confirmation label
    label.config(text="Database started.")
    
    # Disable button after click
    database_button.config(state=tk.DISABLED)
    button_clicked["database"] = True

# Create the Tkinter window
root = tk.Tk()
root.title("Project Manager")
root.geometry("300x200")

# Start Frontend Button
frontend_button = tk.Button(root, text="Start Frontend", command=start_frontend)
frontend_button.pack(pady=10)

# Start Database Button
database_button = tk.Button(root, text="Start Database", command=start_database)
database_button.pack(pady=10)

# Label to show feedback after button click
label = tk.Label(root, text="")
label.pack(pady=10)

# Run the Tkinter event loop
root.mainloop()