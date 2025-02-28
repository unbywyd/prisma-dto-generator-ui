import { Injectable } from '@angular/core';
import introJs from 'intro.js';

@Injectable({
  providedIn: 'root'
})
export class IntroService {

  private intro = introJs();

  startTour() {
    this.intro.setOptions({
      steps: [
        {
          element: '#global-step',
          title: 'Welcome to Prisma DTO Generator',
          intro: `
            <h3>📌 Introduction to the Prisma DTO Generator</h3>
            <p>The <a href="https://www.npmjs.com/package/prisma-class-dto-generator" target="_blank">Prisma Class DTO Generator</a> 
            automates the generation of DTOs (Data Transfer Objects) from your Prisma schema. This helps ensure consistency 
            and reduces manual work.</p>
            <p>To set it up, add the following to <code>schema.prisma</code>:</p>
            <pre><code>generator dto_generator {
      provider = "node node_modules/prisma-class-dto-generator"
      output   = "../src/prisma-models"
    }</code></pre>
            <p>Then create <code>generator-config.json</code> for configuration.</p>
          `
        },
        {
          element: '#prisma-schema-editor',
          title: '🛠 Define Your Prisma Schema',
          intro: `
            <p>Write or paste your <strong>Prisma schema</strong> here. 
          `
        },
        {
          element: '#json-config-editor',
          title: '🔧 JSON Configuration Editor',
          intro: `
            <p>This section allows you to <strong>manually configure</strong> the generator. You can:</p>
            <ul>
              <li>Edit JSON directly.</li>
              <li>Use the UI on the right to sync settings automatically.</li>
              <li>Check available options in <a href="https://www.npmjs.com/package/prisma-class-dto-generator?activeTab=code" target="_blank">the source code</a>.</li>
            </ul>
          `
        },
        {
          element: '#ui-constructor',
          title: '🎛 UI Constructor',
          intro: `
            <p>The easiest way to configure your generator step-by-step:</p>
            <ul>
              <li><strong>Basic Settings</strong> – Configure general generator options.</li>
              <li><strong>Extra Models & Enums</strong> – Define custom models and enums.</li>
              <li><strong>Input Models</strong> – Request DTOs (Prisma fields & additional fields).</li>
              <li><strong>Output Models</strong> – Response DTOs with relations.</li>
              <li><strong>Lists</strong> – Structured collections with filtering, sorting, and pagination.</li>
            </ul>
          `
        },
        {
          element: '#final-step',
          title: '🚀 Ready to Generate?',
          intro: `
            <p>Once everything is configured, you can generate DTOs with:</p>
            <pre><code>npx prisma generate</code></pre>
            <p>Try the generator now:</p>
            <p>
              <a href="https://www.npmjs.com/package/@tsdiapi/cli" target="_blank">@tsdiapi/cli on NPM</a>  
              &nbsp;and&nbsp;
              <a href="https://www.npmjs.com/package/@tsdiapi/prisma" target="_blank">@tsdiapi/prisma on NPM</a> 🚀
            </p>
          `
        }
      ],
      showProgress: true,
      showBullets: false,
      nextLabel: 'Next →',
      prevLabel: '← Back',
      doneLabel: 'Finish 🚀'
    });
    const TOUR_KEY = 'prisma-dto-generator-tour';
    this.intro.oncomplete(() => {
      localStorage.setItem(TOUR_KEY, 'true');
    });
    if (localStorage.getItem(TOUR_KEY) !== 'true') {
      this.intro.start();
    }
  }
}
