import os

import re



def scan_controllers(directory):
  
    bugs = []
  
    for root, dirs, files in os.walk(directory):
      
        for file in files:
          
            if file.endswith('.js'):
              
                path = os.path.join(root, file)
              
                with open(path, 'r') as f:
                  
                    content = f.read()
                  
                    # Pattern 1: Missing validation (req.body used without schema.parse)

                    if 'req.body' in content and 'Schema.parse' not in content:
                      
                        bugs.append({
                          
                            'file': path,
                          
                            'type': 'Missing Validation',
                          
                            'description': 'req.body is used directly without schema validation.'
                          
                        })
                      
    return bugs
  


def generate_report(bugs):
  
    report = "# Bug Detection Report\n\n"
  
    report += "The following low-hanging fruit bugs were detected automatically:\n\n"
  
    for bug in bugs:
      
        report += f"## {bug['type']} in `{os.path.basename(bug['file'])}` \n"
      
        report += f"- **File:** `{bug['file']}`\n"
      
        report += f"- **Issue:** {bug['description']}\n\n"
      
    return report
  


if __name__ == "__main__":
  
    controllers_dir = "apps/api/src/controllers"
  
    found_bugs = scan_controllers(controllers_dir)
  
    print(generate_report(found_bugs))

























