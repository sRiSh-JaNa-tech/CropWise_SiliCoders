with open('src/ai/graph.py', 'r') as f:
    text = f.read()

text = text.replace('category = res.content.strip().lower()', 'category_content = res.content\n    if isinstance(category_content, list):\n        category = "".join([p.get("text", "") for p in category_content if isinstance(p, dict) and p.get("type") == "text"]).strip().lower()\n    else:\n        category = category_content.strip().lower()')
text = text.replace('return {"response": res.content}', 'resp_content = res.content\n    if isinstance(resp_content, list):\n        resp_content = "".join([p.get("text", "") for p in resp_content if isinstance(p, dict) and p.get("type") == "text"])\n    return {"response": resp_content}')

with open('src/ai/graph.py', 'w') as f:
    f.write(text)
