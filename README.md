# Statement-Categorising
User uploads pdf/excel/csv bank statements so the pdf should be read and extracted and then the txn should be categorised by sections we create (food, shopping, etc.)  

How can AI/LLM can be implemented: here AI can help us in categorising the txns into sections and also we will teach llm for advanced level where it can say eligible for tax benefits or not from the previous data and training from finetuning llm or any relevant method.

Expected and good tech stack for this: 

Frontend: React, CSS, chart js
Backend: Node js + Express js, Python with Fast API or flask
Authentication (optional): Auth0 or Firebase or JWT
AI: With API, Rule-based fallback (future: embedding/fine-tuning with the collected data)
Data: Pandas for processing and MongoDB
Deployment: Vercel+Render+MongoDB atlas

Proposed work flow: 

Upload doc -> OCR (optical char recognition) processing -> Extract txns -> Predicting txns categories -> store data in DB’s -> Show output 


