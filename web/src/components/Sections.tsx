import { corpusAuthors } from "../data/content";

export function Architecture() {
  return (
    <section id="architecture" className="architecture-section-new">
      {/* Subtle grid background */}
      <div className="architecture-grid-bg" />

      <div className="section-shell">
        <div className="section-heading centered">
          <div className="section-kicker-badge">
            <svg className="kicker-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
            </svg>
            Глубокое обучение
          </div>
          <h2>Архитектура Модели</h2>
          <p className="section-lead">Полный спектр современных методов оптимизации и строения нейросетей, реализованных в чистом, модульном виде.</p>
        </div>

        {/* Bento Grid Layout */}
        <div className="bento-grid">
          
          {/* Card 1: MoE (Large Span 8) */}
          <div className="bento-card moe-card group">
            {/* Abstract Background Graphic */}
            <div className="bento-graphic-wrapper">
              <svg className="bento-svg text-cyan-glow" viewBox="0 0 400 300" fill="none">
                <path d="M50 150 Q150 150 200 50 T350 50" stroke="currentColor" strokeWidth="2" strokeDasharray="4 4" className="animate-dash-flow"/>
                <path d="M50 150 Q150 150 200 150 T350 150" stroke="currentColor" strokeWidth="4"/>
                <path d="M50 150 Q150 150 200 250 T350 250" stroke="currentColor" strokeWidth="2" strokeDasharray="4 4" className="animate-dash-flow"/>
                <circle cx="200" cy="50" r="6" fill="#030305" stroke="currentColor" strokeWidth="3"/>
                <circle cx="200" cy="150" r="10" fill="#030305" stroke="currentColor" strokeWidth="4" className="animate-pulse"/>
                <circle cx="200" cy="250" r="6" fill="#030305" stroke="currentColor" stroke-width="3"/>
              </svg>
              <div className="bento-graphic-fade"></div>
            </div>
            
            <div className="bento-card-content">
              <div className="bento-icon-box cyan">
                <svg className="bento-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <h3>Mixture of Experts <span className="bento-title-accent">(MoE)</span></h3>
              <p>Интеллектуальная маршрутизация токенов через специализированные экспертные слои. Позволяет радикально масштабировать количество параметров модели без линейного роста вычислительных затрат на инференс.</p>
            </div>
          </div>

          {/* Card 2: GQA (Span 4) */}
          <div className="bento-card gqa-card group">
            <div className="bento-graphic-wrapper half-height">
              <svg className="bento-svg text-purple-glow" viewBox="0 0 200 150" fill="none">
                <path d="M150 20 L150 130" stroke="currentColor" strokeWidth="12" strokeLinecap="round"/>
                <path d="M50 40 C 100 40, 100 75, 140 75" stroke="currentColor" strokeWidth="2"/>
                <path d="M50 75 C 100 75, 100 75, 140 75" stroke="currentColor" stroke-width="2"/>
                <path d="M50 110 C 100 110, 100 75, 140 75" stroke="currentColor" stroke-width="2"/>
              </svg>
            </div>
            <div className="bento-card-content">
              <div className="bento-icon-box purple">
                <svg className="bento-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </div>
              <h3>Grouped Query Attention</h3>
              <p>Группировка запросов для использования общих ключей и значений. Снижает потребление VRAM.</p>
            </div>
          </div>

          {/* Card 3: RoPE (Span 4) */}
          <div className="bento-card rope-card group">
            <div className="bento-graphic-wrapper aspect-square">
              <svg className="bento-svg text-pink-glow animate-spin-reverse-slow" viewBox="0 0 100 100" fill="none">
                <circle cx="50" cy="50" r="40" stroke="currentColor" strokeWidth="1" strokeDasharray="4 4"/>
                <circle cx="50" cy="50" r="30" stroke="currentColor" strokeWidth="2" strokeDasharray="10 10"/>
                <circle cx="50" cy="50" r="20" stroke="currentColor" strokeWidth="1"/>
              </svg>
            </div>
            <div className="bento-card-content">
              <div className="bento-icon-box pink">
                <svg className="bento-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </div>
              <h3>RoPE Embeddings</h3>
              <p>Ротационное позиционное кодирование для безупречной экстраполяции длины контекста.</p>
            </div>
          </div>

          {/* Card 4: Speculative Decoding (Span 4) */}
          <div className="bento-card speculative-card group">
            <div className="bento-graphic-wrapper full-gradient" />
            <div className="bento-card-content">
              <div className="bento-icon-box blue">
                <svg className="bento-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3>Speculative Decoding</h3>
              <p>Двухэтапная генерация: маленькая модель делает драфты, большая — параллельно их валидирует.</p>
            </div>
          </div>

          {/* Card 5: xQuant (Span 4) */}
          <div className="bento-card xquant-card group">
            <div className="bento-quant-grid">
              <div className="quant-cell high"></div>
              <div className="quant-cell low"></div>
              <div className="quant-cell high"></div>
              <div className="quant-cell low"></div>
              <div className="quant-cell low"></div>
              <div className="quant-cell high"></div>
              <div className="quant-cell high"></div>
              <div className="quant-cell low"></div>
              <div className="quant-cell high"></div>
              <div className="quant-cell high"></div>
              <div className="quant-cell low"></div>
              <div className="quant-cell high"></div>
              <div className="quant-cell low"></div>
              <div className="quant-cell high"></div>
              <div className="quant-cell low"></div>
              <div className="quant-cell high"></div>
            </div>
            <div className="bento-card-content">
              <div className="bento-icon-box green">
                <svg className="bento-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </div>
              <h3>Квантование (xQuant)</h3>
              <p>Динамическое снижение разрядности весов до 8-bit/4-bit для запуска на обычных GPU.</p>
            </div>
          </div>

          {/* Card 6: RMSNorm & SwiGLU (Wide Span 12) */}
          <div className="bento-card rms-swiglu-card group">
            <div className="bento-graphic-wrapper wave-bg">
              <svg className="bento-svg text-yellow-glow" preserveAspectRatio="none" viewBox="0 0 1000 200" fill="none">
                <path d="M0 100 Q 250 50, 500 100 T 1000 100" stroke="currentColor" strokeWidth="2" className="animate-dash-flow" strokeDasharray="10 10"/>
                <path d="M0 100 Q 250 150, 500 100 T 1000 100" stroke="currentColor" strokeWidth="1"/>
              </svg>
            </div>
            
            <div className="bento-card-content flex-row">
              <div className="bento-icon-box yellow">
                <svg className="bento-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div className="bento-card-text-group">
                <h3>RMSNorm & SwiGLU</h3>
                <p>Связка Root Mean Square Normalization и функции активации Swish-Gated Linear Unit. Стандарт де-факто для современных архитектур уровня LLaMA, обеспечивающий стабильную и быструю сходимость градиентов.</p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}

export function Corpus() {
  return (
    <section id="corpus" className="corpus-section-new">
      {/* Decorative background blur elements */}
      <div className="corpus-bg-orb-1"></div>
      <div className="corpus-bg-orb-2"></div>

      <div className="section-shell corpus-grid-container">
        
        {/* Left Column: Description & Datasets */}
        <div className="corpus-left-col">
          <div className="corpus-heading-box">
            <h2>Литературный Корпус</h2>
            <p className="corpus-lead">
              Модель не обучается на случайном шуме из интернета. Мы бережно собрали, очистили и токенизировали шедевры классической русской литературы. Это <span className="text-white-highlight">чистый культурный код</span>, превращенный в многомерные тензоры.
            </p>
          </div>
          
          {/* Grid with author datasets */}
          <div className="corpus-authors-grid">
            {corpusAuthors.map((author) => (
              <div key={author.name} className={`glass-card corpus-author-card tone-${author.tone}`}>
                <div className="author-card-header">
                  <span className="author-name">{author.name}</span>
                  <span className="author-tokens">{author.tokens}</span>
                </div>
                <p className="author-works">{author.works}</p>
                <div className="author-progress-bar">
                  <div 
                    className="author-progress-fill" 
                    style={{ width: `${author.progress}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Data Ingestion Pipeline */}
        <div className="corpus-pipeline-col">
          
          {/* Animated central line (Data Stream) */}
          <svg className="pipeline-datastream-svg" fill="none">
            <path d="M20 0 V600" stroke="rgba(255,255,255,0.1)" strokeWidth="2" strokeDasharray="8 8" className="animate-dash-flow" style={{ animationDuration: "2s" }}/>
            <circle cx="20" cy="0" r="3" fill="#06b6d4">
              <animate attributeName="cy" values="0;600" dur="2.5s" repeatCount="indefinite" />
              <animate attributeName="fill" values="#06b6d4;#c084fc;#f472b6" dur="2.5s" repeatCount="indefinite" />
            </circle>
            <circle cx="20" cy="0" r="2" fill="#fff">
              <animate attributeName="cy" values="0;600" dur="3s" begin="1s" repeatCount="indefinite" />
            </circle>
          </svg>

          {/* Block 1: Source Text */}
          <div className="glass-card pipeline-block source-text-block">
            <div className="pipeline-block-header cyan-border">
              <svg className="pipeline-icon text-cyan" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span className="pipeline-label text-cyan">dataset/tolstoy_anna.txt</span>
            </div>
            <div className="pipeline-quote-content">
              «Все счастливые семьи похожи друг на друга, каждая несчастлива по-своему.»
            </div>
          </div>

          {/* Block 2: Tokenization */}
          <div className="glass-card pipeline-block tokenization-block">
            <div className="pipeline-block-header purple-border">
              <svg className="pipeline-icon text-purple" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
              </svg>
              <span className="pipeline-label text-purple">BPE_Tokenizer.encode()</span>
            </div>
            <div className="pipeline-tokens-content">
              <span>[</span> 1405, 5920, 11432, 903, 11, 450, 19, 450, 11, 8042, 1143, 3105, 1143, 401 <span>]</span>
            </div>
          </div>

          {/* Block 3: PyTorch Model */}
          <div className="glass-card pipeline-block model-block">
            <div className="pipeline-block-header pink-border">
              <svg className="pipeline-icon text-pink" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
              <span className="pipeline-label text-pink">model.forward(idx)</span>
            </div>
            <div className="pipeline-code-content">
              <div><span className="code-keyword">def</span> <span className="code-func">forward</span>(self, idx):</div>
              <div className="pl-4">x = self.tok_emb(idx)</div>
              <div className="pl-4">x = x + self.pos_emb(pos)</div>
              <div className="pl-4">
                <span className="code-keyword">for</span> block <span className="code-keyword">in</span> self.blocks:<br />
                &nbsp;&nbsp;&nbsp;&nbsp;x = block(x)
              </div>
              <div className="pl-4"><span className="code-keyword">return</span> self.lm_head(x)</div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
