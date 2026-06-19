'use client';

import { useState, useRef, useCallback } from 'react';
import Breadcrumbs from '@/components/Breadcrumbs';
import { Code, Copy, Check, Minimize2, Maximize2, Braces, FileText } from 'lucide-react';

export default function JsonFormatterPage() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [tabSize, setTabSize] = useState(2);
  const [wrap, setWrap] = useState(true);
  const outputRef = useRef<HTMLTextAreaElement>(null);

  const stats = {
    chars: input.length,
    lines: input ? input.split('\n').length : 0,
  };

  const detectAndParse = useCallback((text: string): unknown => {
    const trimmed = text.trim();
    if (!trimmed) throw new Error('No input provided.');

    if (
      (trimmed.startsWith('{') && trimmed.endsWith('}')) ||
      (trimmed.startsWith('[') && trimmed.endsWith(']'))
    ) {
      return JSON.parse(trimmed);
    }

    const scripts = trimmed.match(/<script[^>]*>([\s\S]*?)<\/script>/gi);
    if (scripts) {
      for (const tag of scripts) {
        const inner = tag.replace(/<script[^>]*>/i, '').replace(/<\/script>/i, '').trim();
        if (
          inner.startsWith('{') ||
          inner.startsWith('[')
        ) {
          return JSON.parse(inner);
        }
      }
    }

    const xmlLike =
      trimmed.startsWith('<') && trimmed.endsWith('>');
    if (xmlLike) {
      throw new Error(
        'Input appears to be XML/HTML but contains no embedded JSON in <script> tags.'
      );
    }

    return JSON.parse(trimmed);
  }, []);

  const formatJson = useCallback(() => {
    try {
      setError('');
      const data = detectAndParse(input);
      const formatted = JSON.stringify(data, null, tabSize);
      setOutput(formatted);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      const lineMatch = msg.match(/position\s+(\d+)/i);
      let detail = msg;
      if (lineMatch) {
        const pos = parseInt(lineMatch[1], 10);
        const before = input.substring(0, pos);
        const line = (before.match(/\n/g) || []).length + 1;
        detail = `${msg} (near line ${line})`;
      }
      setError(detail);
      setOutput('');
    }
  }, [input, tabSize, detectAndParse]);

  const minifyJson = useCallback(() => {
    try {
      setError('');
      const data = detectAndParse(input);
      const minified = JSON.stringify(data);
      setOutput(minified);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg);
      setOutput('');
    }
  }, [input, detectAndParse]);

  const copyOutput = useCallback(async () => {
    if (!output) return;
    try {
      await navigator.clipboard.writeText(output);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      outputRef.current?.select();
      document.execCommand('copy');
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  }, [output]);

  const panelStyle: React.CSSProperties = {
    flex: '1 1 420px',
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column',
  };

  const textareaStyle: React.CSSProperties = {
    width: '100%',
    height: '520px',
    resize: 'vertical',
    fontFamily: "'Courier New', Consolas, monospace",
    fontSize: '0.9rem',
    lineHeight: 1.6,
    padding: '16px',
    border: '1.5px solid hsl(var(--border-glass))',
    borderRadius: '10px',
    background: 'hsl(var(--bg-card))',
    color: 'hsl(var(--text-primary))',
    outline: 'none',
    transition: 'border-color 0.2s, box-shadow 0.2s',
    whiteSpace: wrap ? 'pre-wrap' : 'pre',
    wordBreak: wrap ? 'break-all' : 'normal',
    overflowWrap: wrap ? 'break-word' : 'normal',
    tabSize: tabSize,
  };

  return (
    <div className="container" style={{ paddingBottom: '80px' }}>
      <Breadcrumbs />

      <section
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '14px',
          marginTop: '28px',
          marginBottom: '32px',
        }}
      >
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: 12,
            background: 'hsla(var(--color-primary) / 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'hsl(var(--color-primary))',
            flexShrink: 0,
          }}
        >
          <Braces size={26} />
        </div>
        <div>
          <h1 style={{ fontSize: '1.7rem', fontWeight: 800, lineHeight: 1.2 }}>
            JSON Formatter
          </h1>
          <p style={{ fontSize: '0.92rem', color: 'hsl(var(--text-muted))' }}>
            Format, minify, and validate JSON instantly
          </p>
        </div>
      </section>

      {/* Toolbar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          flexWrap: 'wrap',
          marginBottom: '20px',
          padding: '14px 18px',
          background: 'hsl(var(--bg-card))',
          border: '1px solid hsl(var(--border-glass))',
          borderRadius: '12px',
          boxShadow: 'var(--shadow-card)',
        }}
      >
        <button
          className="neon-btn"
          onClick={formatJson}
          disabled={!input.trim()}
          style={{ opacity: input.trim() ? 1 : 0.5 }}
        >
          <Code size={16} />
          Format
        </button>

        <button
          className="neon-btn-secondary"
          onClick={minifyJson}
          disabled={!input.trim()}
          style={{ opacity: input.trim() ? 1 : 0.5 }}
        >
          <Minimize2 size={16} />
          Minify
        </button>

        <button
          className="neon-btn-secondary"
          onClick={copyOutput}
          disabled={!output}
          style={{ opacity: output ? 1 : 0.5 }}
        >
          {copied ? <Check size={16} /> : <Copy size={16} />}
          {copied ? 'Copied!' : 'Copy Output'}
        </button>

        <div style={{ flex: 1 }} />

        {/* Tab size */}
        <label
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '0.88rem',
            color: 'hsl(var(--text-secondary))',
            fontWeight: 500,
          }}
        >
          Indent:
          <select
            value={tabSize}
            onChange={(e) => setTabSize(Number(e.target.value))}
            style={{
              padding: '6px 10px',
              border: '1.5px solid hsl(var(--border-glass))',
              borderRadius: '6px',
              background: 'hsl(var(--bg-card))',
              color: 'hsl(var(--text-primary))',
              fontSize: '0.88rem',
              cursor: 'pointer',
            }}
          >
            <option value={2}>2 spaces</option>
            <option value={4}>4 spaces</option>
          </select>
        </label>

        {/* Wrap toggle */}
        <label
          className="customCheckbox"
          style={{ margin: 0, whiteSpace: 'nowrap' }}
        >
          <input
            type="checkbox"
            checked={wrap}
            onChange={() => setWrap(!wrap)}
          />
          <span className="checkmark" />
          Wrap
        </label>
      </div>

      {/* Panels */}
      <div
        style={{
          display: 'flex',
          gap: '20px',
          flexWrap: 'wrap',
        }}
      >
        {/* Input Panel */}
        <div style={panelStyle}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '10px',
            }}
          >
            <FileText size={16} style={{ color: 'hsl(var(--text-muted))' }} />
            <span
              style={{
                fontSize: '0.9rem',
                fontWeight: 600,
                color: 'hsl(var(--text-secondary))',
              }}
            >
              Input
            </span>
            <span
              style={{
                marginLeft: 'auto',
                fontSize: '0.8rem',
                color: 'hsl(var(--text-muted))',
              }}
            >
              {stats.chars.toLocaleString()} chars &middot; {stats.lines.toLocaleString()} lines
            </span>
          </div>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder='Paste your JSON, HTML, or XML here...\nExample: {"name": "John", "age": 30}'
            style={textareaStyle}
            spellCheck={false}
          />
        </div>

        {/* Output Panel */}
        <div style={panelStyle}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '10px',
            }}
          >
            <Maximize2 size={16} style={{ color: 'hsl(var(--text-muted))' }} />
            <span
              style={{
                fontSize: '0.9rem',
                fontWeight: 600,
                color: 'hsl(var(--text-secondary))',
              }}
            >
              Output
            </span>
            {output && (
              <span
                style={{
                  marginLeft: 'auto',
                  fontSize: '0.8rem',
                  color: 'hsl(var(--text-muted))',
                }}
              >
                {output.length.toLocaleString()} chars &middot;{' '}
                {output.split('\n').length.toLocaleString()} lines
              </span>
            )}
          </div>
          {error ? (
            <div
              style={{
                padding: '20px',
                borderRadius: '10px',
                border: '1.5px solid hsl(var(--color-danger) / 0.3)',
                background: 'hsla(var(--color-danger) / 0.05)',
                color: 'hsl(var(--color-danger))',
                fontFamily: "'Courier New', monospace",
                fontSize: '0.88rem',
                lineHeight: 1.7,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-all',
              }}
            >
              <div
                style={{
                  fontWeight: 700,
                  marginBottom: '8px',
                  fontSize: '0.95rem',
                }}
              >
                ⚠ Parse Error
              </div>
              {error}
            </div>
          ) : (
            <textarea
              ref={outputRef}
              value={output}
              readOnly
              placeholder="Formatted output will appear here..."
              style={{
                ...textareaStyle,
                background: output
                  ? 'hsl(var(--bg-card))'
                  : 'hsl(var(--bg-subtle))',
                cursor: 'default',
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
