/**
 * ==============================================================================
 * ENTERPRISE MULTI-MODEL GENAI FRAMEWORK
 * MODULE: HIGH AVAILABILITY (HA) SIMULATOR
 * ==============================================================================
 * Manages the Glassmorphism overlay, the terminal-based execution simulator, and 
 * the dynamic generation of production-ready Python resilience runbooks.
 * ==============================================================================
 */

// ==============================================================================
// DYNAMIC RUNBOOK GENERATOR
// ==============================================================================
/**
 * Constructs contextual documentation and functional Python SDK implementations.
 * Injects the explicit Project ID, Model ID, and Champion Region targeted by the operator.
 * 
 * @param {string} championRegion - The targeted optimal region.
 * @param {string} modelId - The selected model.
 * @param {string} projectId - The active Google Cloud project.
 * @returns {object} - Dictionary containing HTML documentation strings and code payloads.
 */
function getRunbooks(championRegion, modelId, projectId) {
    return {
        global: {
            docs: `
                <div style="margin-bottom: 16px; color: var(--text-color); font-size: 0.9rem; line-height: 1.6;">
                    <strong style="color: var(--highlight);">The "Global" Logic:</strong> When you hit <code>aiplatform.googleapis.com</code> with location='global', Google's load balancer picks the best region for you. This is the highest availability path and dynamically pools capacity.<br><br>
                    <strong style="color: var(--highlight);">The "Residency" Logic:</strong> If you are bound by GDPR, your mesh should likely end at <code>europe-west1</code> (Belgium) or <code>europe-west4</code> (Netherlands) instead of global. These regions often serve as the "anchor hubs" for the European multi-region.
                </div>
                
                <div style="border-top: 1px solid var(--border-color); padding-top: 16px; margin-bottom: 12px; color: var(--text-color); font-size: 0.9rem;">
                    <strong>Adjust for your Payment Model:</strong>
                </div>
                
                <div style="display: flex; flex-direction: column; gap: 12px; font-size: 0.85rem;">
                    <div style="padding-left: 12px; border-left: 3px solid #4285F4;">
                        <a href="https://docs.cloud.google.com/gemini-enterprise-agent-platform/models/standard-paygo" target="_blank" class="drawer-link"><i class="fas fa-external-link-alt me-2"></i><strong>Standard pay-as-you-go:</strong></a> Uses shared resources. Use exponential backoff to handle transient rate limit errors (429s) caused by traffic spikes.
                    </div>
                    
                    <div style="padding-left: 12px; border-left: 3px solid #34A853;">
                        <a href="https://docs.cloud.google.com/gemini-enterprise-agent-platform/models/flex-paygo" target="_blank" class="drawer-link"><i class="fas fa-external-link-alt me-2"></i><strong>Flex pay-as-you-go:</strong></a> Designed for lower-priority, slower processing. Do not retry aggressively; instead, increase your request timeout (for example, to 30 minutes) to give the system time to complete the task.
                    </div>
                    
                    <div style="padding-left: 12px; border-left: 3px solid #FBBC05;">
                        <a href="https://docs.cloud.google.com/gemini-enterprise-agent-platform/models/priority-paygo" target="_blank" class="drawer-link"><i class="fas fa-external-link-alt me-2"></i><strong>Priority pay-as-you-go:</strong></a> Designed for latency-sensitive, high-reliability workloads without the upfront commitment of Provisioned Throughput. If you receive a 429 error, retry with exponential backoff, but ensure you are not exceeding your quota.
                    </div>
                    
                    <div style="padding-left: 12px; border-left: 3px solid #EA4335;">
                        <a href="https://docs.cloud.google.com/gemini-enterprise-agent-platform/models/provisioned-throughput" target="_blank" class="drawer-link"><i class="fas fa-external-link-alt me-2"></i><strong>Provisioned Throughput:</strong></a> Uses reserved capacity. Frequent errors usually indicate you have exceeded your purchased capacity, so adding retries may not solve the underlying issue.
                    </div>
                </div>
            `,
            code: `` 
        },
        multiregion: {
            docs: `
                <div style="margin-bottom: 16px; color: var(--text-color); font-size: 0.9rem; line-height: 1.5;">
                    This script is a perfect representation of the <strong>Layer 1 (Native SDK) resilience strategy</strong>. 
                    While the "Mesh" script provides Macro-Resilience (switching regions), this focuses on Micro-Resilience (fixing transient errors within a single region).<br><br>
                    <strong>Strict Data Residency:</strong> By pinning the location and utilizing native logic, the request never leaves the designated boundary. Critical for regulated industries.
                </div>
                <strong>Authoritative Runbooks:</strong><br>
                <div style="margin-top: 8px; display: flex; flex-direction: column; gap: 8px;">
                    <div><a href="https://cloud.google.com/blog/products/ai-machine-learning/learn-how-to-handle-429-resource-exhaustion-errors-in-your-llms?e=48754805" target="_blank" class="drawer-link"><i class="fas fa-external-link-alt me-2"></i>A guide to handling 429 errors</a></div>
                    <div><a href="https://cloud.google.com/blog/products/ai-machine-learning/reduce-429-errors-on-vertex-ai?e=48754805" target="_blank" class="drawer-link"><i class="fas fa-external-link-alt me-2"></i>Build Resilient LLM Applications and Reduce 429 Errors</a></div>
                </div>
            `,
            code: `<span class="comment"># ============================================================
# ARCHITECTURE: NATIVE SDK EXPONENTIAL BACKOFF
# ============================================================
# Enforces strict Data Residency bounds while utilizing the native Google GenAI 
# HttpRetryOptions to automatically back off and retry upon hitting 429 
# Resource Exhausted limits during massive traffic spikes.
# ============================================================</span>

<span class="keyword">from</span> google <span class="keyword">import</span> genai
<span class="keyword">from</span> google.genai <span class="keyword">import</span> types

PROJECT_ID = "${projectId}"
LOCATION = "${championRegion}"  <span class="comment"># Designated Champion Hub</span>
MODEL_ID = "${modelId}"

<span class="comment"># Layer 1: Native Micro-Resilience (Jittered Exponential Backoff)</span>
client = genai.Client(
    vertexai=True,
    project=PROJECT_ID,
    location=LOCATION,
    http_options=types.HttpOptions(
        retry_options=types.HttpRetryOptions(
            initial_delay=1.0, <span class="comment"># Micro-Retry Jitter prevents Thundering Herd</span>
            max_delay=60.0,    <span class="comment"># Caps the exponential wait at 1 minute</span>
            attempts=5,        <span class="comment"># Extends Google's default of 4</span>
            http_status_codes=[429, 500, 502, 503, 504],
        ),
        timeout=120 * 1000,
    ),
)

<span class="keyword">def</span> execute_resilient_inference(prompt):
    print(f"[*] Transmitting payload to {LOCATION}...")
    response = client.models.generate_content(model=MODEL_ID, contents=prompt)
    print(f"[SUCCESS] 200 OK")
    <span class="keyword">return</span> response.text

<span class="keyword">if</span> __name__ == "__main__":
    print(execute_resilient_inference("Explain Exponential Backoff."))`
        },
        custom: {
            docs: `
                <div class="system-notice-box">
                    <div class="system-notice-title"><i class="fas fa-robot me-2"></i>PROOF OF CONCEPT & LIABILITY DISCLAIMER</div>
                    <div class="system-notice-text">
                        This repository is provided strictly as a conceptual Proof of Concept (PoC) to illustrate dynamic multi-region routing mechanisms. It is not intended for production use as-is. Organizations must conduct their own load testing, security audits, and error-handling implementations before adapting this architectural logic into a live production environment.
                    </div>
                </div>
                
                <div style="font-size: 0.85rem; color: var(--text-color); margin-bottom: 16px;">
                    <strong>Explicit Resource Mapping & Data Residency</strong><br>
                    This architecture ensures that if an entire region goes dark or has a model registry lag (404), the application continues to function by shifting to a "Champion" hub. <br><br>
                    <span style="color: var(--highlight);">Pro-Tip:</span> If your application must comply with GDPR (EU) or CCPA (US), ensure your REGION_MESH only contains regions within those boundaries. Switching from <code>europe-west6</code> to <code>global</code> might violate residency requirements if global routes to a US datacenter.
                </div>
                
                <div style="background: rgba(0,0,0,0.3); border-radius: 6px; padding: 12px; font-size: 0.8rem; overflow-x: auto;">
                    <table style="width: 100%; border-collapse: collapse; text-align: left;">
                        <tr style="border-bottom: 1px solid var(--border-color); color: var(--highlight);">
                            <th style="padding-bottom: 8px;">Strategy Layer</th>
                            <th style="padding-bottom: 8px;">Trigger</th>
                            <th style="padding-bottom: 8px;">Action</th>
                        </tr>
                        <tr style="border-bottom: 1px solid var(--border-color);">
                            <td style="padding: 8px 0; color: var(--text-color);">Micro-Retry (L1)</td>
                            <td style="padding: 8px 0; color: var(--muted-color);">429, 503</td>
                            <td style="padding: 8px 0; color: var(--muted-color);">Native Jittered Backoff.</td>
                        </tr>
                        <tr style="border-bottom: 1px solid var(--border-color);">
                            <td style="padding: 8px 0; color: var(--text-color);">Mesh Failover (L2)</td>
                            <td style="padding: 8px 0; color: var(--muted-color);">404, 400</td>
                            <td style="padding: 8px 0; color: var(--muted-color);">Immediate hop to next region.</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0; color: var(--text-color);">Global Anchor</td>
                            <td style="padding: 8px 0; color: var(--muted-color);">Exhaustion</td>
                            <td style="padding: 8px 0; color: var(--muted-color);">Routes to healthiest global cluster.</td>
                        </tr>
                    </table>
                </div>
            `,
            code: `<span class="comment"># ============================================================
# ARCHITECTURE: TWO-TIERED ASYNC MESH FAILOVER
# ============================================================
# Demonstrates production-grade resilience combining native SDK micro-retries 
# (Layer 1) with cross-region macro-failovers (Layer 2).
#
# Prerequisite: pip install google-genai asyncio
# ============================================================</span>

<span class="keyword">import</span> asyncio
<span class="keyword">import</span> logging
<span class="keyword">import</span> itertools
<span class="keyword">from</span> google <span class="keyword">import</span> genai
<span class="keyword">from</span> google.genai <span class="keyword">import</span> types, errors

PROJECT_ID = "${projectId}"
MODEL_ID = "${modelId}"

<span class="comment"># Priority Mesh: Secondary Hubs -> Champion Anchor</span>
REGION_MESH = ["me-central2", "europe-west6", "${championRegion}"]
mesh_cycle = itertools.cycle(REGION_MESH)

logging.basicConfig(level=logging.INFO, format='%(asctime)s | %(levelname)s | %(message)s', datefmt='%H:%M:%S')
logger = logging.getLogger(__name__)

<span class="keyword">async def</span> execute_resilient_inference(prompt, max_hops=3):
    logger.info(f"Initiating HA Mesh Routing Protocol for model: {}")

    <span class="keyword">for</span> hop <span class="keyword">in</span> range(max_hops):
        current_loc = next(mesh_cycle)
        logger.info(f"[*] HOP {hop + 1}/{max_hops} - Targeting Region: {current_loc}")
        
        <span class="keyword">try</span>:
            <span class="comment"># Layer 1: Native Micro-Resilience (Jittered Backoff)</span>
            client = genai.Client(
                vertexai=True, project=PROJECT_ID, location=current_loc,
                http_options=types.HttpOptions(
                    retry_options=types.HttpRetryOptions(initial_delay=1.0, attempts=3, http_status_codes=[408, 429, 500, 502, 503, 504]),
                    timeout=120 * 1000
                ),
            )
            response = await client.aio.models.generate_content(model=MODEL_ID, contents=prompt)
            logger.info(f"[SUCCESS] 200 OK established at {current_loc}")
            <span class="keyword">return</span> response.text

        <span class="keyword">except</span> errors.APIError <span class="keyword">as</span> e:
            code = getattr(e, 'code', 0)
            <span class="keyword">if</span> code <span class="keyword">in</span> [429, 503]:
                logger.warning(f"[-] {current_loc} exhausted Layer 1 micro-retries (HTTP {code}). Shifting mesh route...")
            <span class="keyword">elif</span> code <span class="keyword">in</span> [400, 403, 404]:
                logger.error(f"[!] Fatal Deployment Block at {current_loc} (HTTP {code}). Instantly failing over...")
            <span class="keyword">else</span>:
                logger.error(f"[X] Unexpected API Exception at {current_loc}: {e}")
                
            <span class="keyword">if</span> hop == max_hops - 1:
                logger.critical(f"CRITICAL: All {max_hops} regions in the mesh have failed.")
                <span class="keyword">raise</span> Exception("Mesh Routing Exhausted.")

<span class="keyword">if</span> __name__ == "__main__":
    result = asyncio.run(execute_resilient_inference("Define a distributed mesh network."))
    print(f"\\n=== FINAL PAYLOAD ===\\n{result}\\n=====================\\n")`
        }
    };
}

// ==============================================================================
// MODAL & TERMINAL VISUALIZATION LOGIC
// ==============================================================================
export function initSimulator() {
    const btnOpen = document.getElementById('btn-ha-simulator');
    const modal = document.getElementById('ha-simulator-modal');
    const btnClose = document.getElementById('btn-close-sim');
    
    const docsBlock = document.getElementById('ha-docs-block');
    const codeBlock = document.getElementById('ha-code-block');
    const btnCopyCode = document.getElementById('btn-copy-code');
    const visLog = document.getElementById('sim-log'); 
    
    const visBox = document.querySelector('.visualizer-box');
    const codeWrapper = document.querySelector('.code-wrapper');
    
    let simTimeouts = [];
    
    // Tracks the execution lifecycle to determine if contextual variables are populated
    let hasRunLiveTest = false;

    // Baseline context payload (Fallback parameters)
    let ctxRegion = 'us-central1';
    let ctxModel = 'gemini-2.5-flash';
    let ctxProject = 'your-project-id';

    // Exposes the simulator trigger globally for programmatic invocation from the telemetry drawer
    window.launchSimulatorWithChampion = (region, model, project) => {
        hasRunLiveTest = true; 
        ctxRegion = region;
        ctxModel = model;
        ctxProject = project;
        openModalAndCheckState('custom');
    };

    // Standard navigation triggers
    btnOpen.addEventListener('click', () => {
        ctxModel = document.getElementById('model-select').value;
        openModalAndCheckState('global');
    });
    
    btnClose.addEventListener('click', () => {
        modal.classList.add('hidden');
        simTimeouts.forEach(t => clearTimeout(t));
    });

    // Code Export Clipboard Integration
    btnCopyCode.addEventListener('click', () => {
        const cleanCode = codeBlock.innerHTML.replace(/<[^>]*>?/gm, '');
        navigator.clipboard.writeText(cleanCode).then(() => {
            btnCopyCode.innerHTML = '<i class="fas fa-check"></i>';
            setTimeout(() => btnCopyCode.innerHTML = '<i class="fas fa-copy"></i>', 2000);
        });
    });

    /**
     * Manages modal initialization and scopes the DEMO warning banner 
     * strictly to the Custom Dictionary architectural scenario.
     * @param {string} targetScenario - The requested simulation view.
     */
    function openModalAndCheckState(targetScenario) {
        modal.classList.remove('hidden');
        document.querySelector(`.scenario-btn[data-scenario="${targetScenario}"]`).click();
    }

    // Handles layout mutation and content injection during scenario transitions
    document.querySelectorAll('.scenario-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.scenario-btn').forEach(b => b.classList.remove('active'));
            e.currentTarget.classList.add('active');
            
            const scenario = e.currentTarget.dataset.scenario;
            const runbooks = getRunbooks(ctxRegion, ctxModel, ctxProject);
            
            docsBlock.innerHTML = runbooks[scenario].docs;
            codeBlock.innerHTML = runbooks[scenario].code;
            
            // Injects a highly visible demo warning strictly for custom topologies 
            // if live telemetry has not been gathered to populate variables.
            const demoWarningBox = document.getElementById('ha-demo-warning');
            if (!hasRunLiveTest && scenario === 'custom') {
                if (!demoWarningBox) {
                    const warningHtml = `
                        <div id="ha-demo-warning" style="background: rgba(253, 187, 45, 0.1); border: 1px solid var(--warning-text); color: var(--warning-text); padding: 12px; border-radius: 6px; margin-bottom: 20px; font-size: 0.85rem;">
                            <i class="fas fa-info-circle me-2"></i><strong>DEMO MODE:</strong> You have not executed a live telemetry scan. The Python scripts below have been populated with placeholder variables (<code>your-project-id</code>, <code>us-central1</code>). Run a live diagnostic sweep to automatically inject your specific environment variables.
                        </div>
                    `;
                    document.querySelector('.ha-code-pane').insertAdjacentHTML('afterbegin', warningHtml);
                }
            } else if (demoWarningBox) {
                demoWarningBox.remove();
            }

            // Halts active visualization timeouts upon scenario transition
            simTimeouts.forEach(t => clearTimeout(t));
            visLog.innerHTML = ''; 

            // Global Endpoint Configuration: Hides terminal and code export
            if (scenario === 'global') {
                visBox.classList.add('hidden');
                codeWrapper.classList.add('hidden');
            } else {
                visBox.classList.remove('hidden');
                codeWrapper.classList.remove('hidden');
                runVisualizer(scenario, ctxRegion, ctxModel);
            }
        });
    });

    /**
     * Formats the current timestamp sequence to emulate standard Python logging.
     * @returns {string} - Formatted timestamp (HH:MM:SS)
     */
    function getLogTime() {
        const now = new Date();
        return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
    }

    /**
     * Injects formatted log strings into the terminal viewport, applying fixed-width 
     * padding to the severity level strings to ensure perfect vertical delimiter alignment.
     * 
     * @param {string} level - Log severity level (INFO, WARNING, ERROR, SUCCESS)
     * @param {string} msg - The log payload
     */
    function appendLog(level, msg) {
        let levelClass = 'term-info';
        if (level === 'ERROR') levelClass = 'term-error';
        if (level === 'WARNING') levelClass = 'term-warning';
        if (level === 'SUCCESS') levelClass = 'term-success';

        // Pads the severity string to exactly 7 characters for strict | alignment
        const paddedLevel = level.padEnd(7, ' ');

        const line = document.createElement('div');
        line.innerHTML = `<span class="term-timestamp">${getLogTime()}</span> | <span class="${levelClass}">${paddedLevel}</span> | ${msg}`;
        visLog.appendChild(line);
        visLog.scrollTop = visLog.scrollHeight; 
    }

    /**
     * Bypasses the standard logging prefix to inject raw application payloads.
     */
    function appendRawLog(msg) {
        const line = document.createElement('div');
        line.style.color = "var(--text-color)";
        line.textContent = msg; 
        visLog.appendChild(line);
        visLog.scrollTop = visLog.scrollHeight;
    }

    /**
     * Extracts authentic secondary datacenters from the rendered Analytics DOM.
     * 
     * @param {string} champion - The targeted primary region to exclude.
     * @param {number} count - The number of secondary hubs to extract.
     * @returns {Array} - Array of region strings.
     */
    function getSecondaryHubs(champion, count) {
        let available = [];
        const secondaryListItems = document.querySelectorAll('#list-secondary li span:first-child');
        
        secondaryListItems.forEach(span => {
            if (span.textContent && span.textContent !== 'Awaiting Telemetry...' && span.textContent !== champion) {
                available.push(span.textContent);
            }
        });
        
        if (available.length < count) {
            const fallbacks = ['me-central2', 'europe-west6', 'asia-northeast1', 'us-west1'];
            available = available.concat(fallbacks);
        }
        
        return available.sort(() => 0.5 - Math.random()).slice(0, count);
    }

    /**
     * Executes the sequential Terminal Animation physics.
     * Manages nested timers to replicate authentic network latency and HTTP state transitions.
     * 
     * @param {string} scenario - The requested routing simulation (multiregion, custom).
     * @param {string} champion - The targeted optimal region.
     * @param {string} model - The targeted AI model.
     */
    function runVisualizer(scenario, champion, model) {
        if (scenario === 'multiregion') {
            simTimeouts.push(setTimeout(() => appendLog('INFO', `Initiating SDK Micro-Resilience Protocol for model: ${model}`), 500));
            simTimeouts.push(setTimeout(() => appendLog('INFO', `[*] Targeting Champion Region: ${champion}`), 1000));
            simTimeouts.push(setTimeout(() => appendLog('WARNING', `HTTP Request: POST https://${champion}-aiplatform... "HTTP/1.1 429 Too Many Requests"`), 2000));
            simTimeouts.push(setTimeout(() => appendLog('WARNING', `[-] ${champion} encountered 429 Resource Exhausted. Native Backoff Initiated (Wait 2s)...`), 2100));
            simTimeouts.push(setTimeout(() => appendLog('INFO', `[*] Retrying Payload to ${champion}...`), 4100));
            simTimeouts.push(setTimeout(() => appendLog('INFO', `HTTP Request: POST https://${champion}-aiplatform... "HTTP/1.1 200 OK"`), 6000));
            simTimeouts.push(setTimeout(() => appendLog('SUCCESS', `[SUCCESS] 200 OK established at ${champion}`), 6100));

        } else if (scenario === 'custom') {
            const secHubs = getSecondaryHubs(champion, 2);
            const sec1 = secHubs[0];
            const sec2 = secHubs[1];
            
            simTimeouts.push(setTimeout(() => appendLog('INFO', `Initiating HA Mesh Routing Protocol for model: ${model}`), 500));
            
            // Hop 1 (404 Failover)
            simTimeouts.push(setTimeout(() => appendLog('INFO', `[*] HOP 1/3 - Targeting Region: ${sec1}`), 1500));
            simTimeouts.push(setTimeout(() => appendLog('INFO', `AFC is enabled with max remote calls: 10.`), 1800));
            simTimeouts.push(setTimeout(() => appendLog('INFO', `HTTP Request: POST https://${sec1}-aiplatform... "HTTP/1.1 404 Not Found"`), 2800));
            simTimeouts.push(setTimeout(() => appendLog('ERROR', `[!] Fatal Deployment Block at ${sec1} (HTTP 404). Instantly failing over...`), 2900));

            // Hop 2 (404 Failover)
            simTimeouts.push(setTimeout(() => appendLog('INFO', `[*] HOP 2/3 - Targeting Region: ${sec2}`), 4000));
            simTimeouts.push(setTimeout(() => appendLog('INFO', `AFC is enabled with max remote calls: 10.`), 4300));
            simTimeouts.push(setTimeout(() => appendLog('INFO', `HTTP Request: POST https://${sec2}-aiplatform... "HTTP/1.1 404 Not Found"`), 5300));
            simTimeouts.push(setTimeout(() => appendLog('ERROR', `[!] Fatal Deployment Block at ${sec2} (HTTP 404). Instantly failing over...`), 5400));

            // Hop 3 (Success)
            simTimeouts.push(setTimeout(() => appendLog('INFO', `[*] HOP 3/3 - Targeting Region: ${champion}`), 6500));
            simTimeouts.push(setTimeout(() => appendLog('INFO', `AFC is enabled with max remote calls: 10.`), 6800));
            simTimeouts.push(setTimeout(() => appendLog('INFO', `HTTP Request: POST https://${champion}-aiplatform... "HTTP/1.1 200 OK"`), 9000));
            simTimeouts.push(setTimeout(() => appendLog('SUCCESS', `[SUCCESS] 200 OK established at ${champion}`), 9100));
            
            // Final Payload Output
            simTimeouts.push(setTimeout(() => appendRawLog(`\n=== FINAL PAYLOAD ===\nA decentralized, self-healing network routing data across redundant paths.\n=====================\n`), 9500));
        }
    }
}