import React, { useState } from 'react';

const fileTypes = [
  { label: 'PDF', value: 'pdf' },
  { label: 'DOCX', value: 'docx' },
  { label: 'PPT', value: 'ppt' },
  { label: 'Other', value: 'other' },
];

const LinkLabeler = () => {
  const [link, setLink] = useState('');
  const [type, setType] = useState('pdf');
  const [submitted, setSubmitted] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted({ link, type });
    setLink('');
    setType('pdf');
  };

  return (
    <div className="max-w-xl mx-auto mt-10 p-6 bg-base-200 rounded-lg shadow-lg">
      <h1 className="text-2xl font-bold mb-6 text-primary">Link Labeler</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block mb-1 font-medium">Link</label>
          <input
            type="url"
            className="input input-bordered w-full"
            placeholder="https://example.com/file.pdf"
            value={link}
            onChange={e => setLink(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="block mb-1 font-medium">File Type</label>
          <select
            className="select select-bordered w-full"
            value={type}
            onChange={e => setType(e.target.value)}
          >
            {fileTypes.map(ft => (
              <option key={ft.value} value={ft.value}>{ft.label}</option>
            ))}
          </select>
        </div>
        <button type="submit" className="btn btn-primary w-full">Label Link</button>
      </form>
      {submitted && (
        <div className="mt-8 p-4 bg-base-100 rounded shadow">
          <div className="font-semibold mb-2">Labeled Link:</div>
          <div className="break-all"><span className="font-bold">Link:</span> {submitted.link}</div>
          <div><span className="font-bold">Type:</span> {fileTypes.find(ft => ft.value === submitted.type)?.label}</div>
        </div>
      )}
    </div>
  );
};

export default LinkLabeler; 