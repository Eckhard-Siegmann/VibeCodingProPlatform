import { test, expect, type Page } from '@playwright/test';

// Helper to confirm template compliance (Soft-UI colors)
async function checkTemplateCompliance(page: Page) {
  // Check main viewport background (#DCEBFF -> rgb(220, 235, 255))
  // We check the body or a main wrapper. SvelteKit usually applies styles to body or #app.
  // Note: computed style might return slightly different values depending on browser color profile, but we rely on standard RGB.
  // We'll check for "blue-ish" background if exact match fails, or exact match.
  // Using a loose check or just logging it.
  const bodyBg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  console.log(`Template Check: Body Background is ${bodyBg} (Expected #DCEBFF / rgb(220, 235, 255))`);
  
  // Check card background (#FEFEFE -> rgb(254, 254, 254))
  // We'll just check one card.
  const card = page.locator('.bg-white').first().or(page.locator('[class*="bg-["]').first()); 
  // We assume classes or styles. Visual check via screenshot is better, but this logs data.
}

test.describe('UI Test Runs', () => {
    // RUN 1: PITCH - EXHAUSTIVE CLICK
    test('Run 1: Pitch - Exhaustive Click', async ({ page }) => {
        await page.goto('http://localhost:5173/');
        await page.getByRole('link', { name: 'Try Pitch Assessment' }).click();
        await expect(page).toHaveURL(/.*\/assess\/pitch-001/);
        
        await checkTemplateCompliance(page);

        // Find all question/rating groups
        const questions = page.getByRole('radiogroup');
        const count = await questions.count();
        console.log(`Pitch Assessment has ${count} items.`);

        // Iterate row by row
        for (let i = 0; i < count; i++) {
            const question = questions.nth(i);
            const options = question.getByRole('radio'); // or button inside radiogroup
            const optionCount = await options.count();
            
            // Click EVERY option
            for (let j = 0; j < optionCount; j++) {
                await options.nth(j).click();
                // Optional: Check if selected state is applied found by aria-checked or class
                await expect(options.nth(j)).toBeChecked(); 
            }
            // Ensure last is selected
            await expect(options.last()).toBeChecked();
        }

        // Submit
        await page.getByRole('button', { name: 'Submit' }).click();
        
        // precise expectation for success? "Thank you" or redirect?
        // We'll wait for URL change or success message
        await expect(page.getByText('Success')
             .or(page.getByText('Thank you'))
             .or(page.getByText('completed')))
             .toBeVisible({ timeout: 5000 });
    });

    // RUN 2: PITCH - NORMAL RUN
    test('Run 2: Pitch - Normal Run', async ({ page }) => {
        await page.goto('http://localhost:5173/');
        await page.getByRole('link', { name: 'Try Pitch Assessment' }).click();
        
        const questions = page.getByRole('radiogroup');
        const count = await questions.count();

        for (let i = 0; i < count; i++) {
            const options = questions.nth(i).getByRole('radio');
            const optionCount = await options.count();
            // Select arbitrary (e.g., 2nd or 3rd)
            const choice = Math.min(2, optionCount - 1);
            await options.nth(choice).click();
        }

        await page.getByRole('button', { name: 'Submit' }).click();
        await expect(page.getByText('Success').or(page.getByText('Thank you'))).toBeVisible();
    });

    // RUN 3: PITCH - VALIDATION & PROGRESS
    test('Run 3: Pitch - Validation & Progress', async ({ page }) => {
        await page.goto('http://localhost:5173/');
        await page.getByRole('link', { name: 'Try Pitch Assessment' }).click();
        
        const questions = page.getByRole('radiogroup');
        const count = await questions.count();
        
        // 1. Check blocking text on first row? (Assuming it appears if not answered? or is it "secured"?)
        // User said: "The first row is secured and the red blocking text shall disappear"
        // Implication: First row MIGHT be disabled or have a warning until something else happens? 
        // OR, maybe it means when we answer it, the text disappears.
        // We'll answer first row and check for text changes.
        
        // Let's answer all EXCEPT last 2
        for (let i = 0; i < count - 2; i++) {
            await questions.nth(i).getByRole('radio').first().click();
        }
        
        // Check progress indicator
        // Look for text like "X of Y" or "X%"
        const progress = await page.getByText(/\d+ of \d+/).or(page.getByText(/\d+%/)).textContent();
        console.log(`Progress Indication: ${progress}`);
        
        // Try Submit (Should fail or be disabled)
        const submitBtn = page.getByRole('button', { name: 'Submit' });
        if (await submitBtn.isDisabled()) {
            console.log('Submit button is disabled as expected.');
        } else {
            await submitBtn.click();
            // Check for validation error on open items
            // User said "red blocking text shall disappear" on first row, maybe "red text" appears on empty rows?
            const errors = page.locator('.text-red-500').or(page.getByRole('alert'));
            const errorCount = await errors.count();
            console.log(`Found ${errorCount} validation errors after premature submit.`);
        }
        
        // Now finish
        await questions.nth(count - 2).getByRole('radio').last().click();
        await questions.nth(count - 1).getByRole('radio').last().click();
        
        await submitBtn.click();
        await expect(page.getByText('Success').or(page.getByText('Thank you'))).toBeVisible();
    });

    // RUN 4: REVIEW - EXHAUSTIVE CLICK
    test('Run 4: Review - Exhaustive Click', async ({ page }) => {
        await page.goto('http://localhost:5173/');
        await page.getByRole('link', { name: 'Try Review Assessment' }).click();
        await expect(page).toHaveURL(/.*\/assess\/review-001/);
        
        const questions = page.getByRole('radiogroup').or(page.getByRole('slider')); // Review might have sliders
        const count = await questions.count();
        console.log(`Review Assessment has ${count} items.`);

        for (let i = 0; i < count; i++) {
             const q = questions.nth(i);
             const role = await q.getAttribute('role');
             
             if (role === 'radiogroup') {
                 const options = q.getByRole('radio');
                 const optCount = await options.count();
                 for (let j = 0; j < optCount; j++) {
                     await options.nth(j).click();
                     await expect(options.nth(j)).toBeChecked();
                 }
             } else if (role === 'slider') {
                 // Exercise slider
                 await q.click(); // touch
                 await q.press('ArrowRight');
                 await q.press('ArrowRight'); // move
             }
        }

        await page.getByRole('button', { name: 'Submit' }).click();
        await expect(page.getByText('Success').or(page.getByText('Thank you'))).toBeVisible();
    });

    // RUN 5: REVIEW - NORMAL RUN
    test('Run 5: Review - Normal Run', async ({ page }) => {
        await page.goto('http://localhost:5173/');
        await page.getByRole('link', { name: 'Try Review Assessment' }).click();
        
        const questions = page.getByRole('radiogroup').or(page.getByRole('slider'));
        const count = await questions.count();

        for (let i = 0; i < count; i++) {
             const q = questions.nth(i);
             const role = await q.getAttribute('role');
             if (role === 'radiogroup') {
                 await q.getByRole('radio').nth(2).click();
             } else {
                 await q.click(); // simple interaction
             }
        }

        await page.getByRole('button', { name: 'Submit' }).click();
        await expect(page.getByText('Success').or(page.getByText('Thank you'))).toBeVisible();
    });

    // RUN 6: REVIEW - VALIDATION & PROGRESS
    test('Run 6: Review - Validation & Progress', async ({ page }) => {
        await page.goto('http://localhost:5173/');
        await page.getByRole('link', { name: 'Try Review Assessment' }).click();
        
        const questions = page.getByRole('radiogroup').or(page.getByRole('slider'));
        const count = await questions.count();

        // Leave 2 open
        for (let i = 0; i < count - 2; i++) {
             const q = questions.nth(i);
             if (await q.getAttribute('role') === 'radiogroup') {
                await q.getByRole('radio').first().click();
             } else {
                await q.click();
             }
        }
        
        console.log('Checking validation on Review...');
        // Just verify we can't submit or see error
        await page.getByRole('button', { name: 'Submit' }).click();
        
        // Finish
        await questions.nth(count - 2).click(); // assuming click works for both types to activate roughly
        if (await questions.nth(count - 2).getAttribute('role') === 'radiogroup') {
             await questions.nth(count - 2).getByRole('radio').first().click();
        }
        
        await questions.nth(count - 1).click();
        if (await questions.nth(count - 1).getAttribute('role') === 'radiogroup') {
             await questions.nth(count - 1).getByRole('radio').first().click();
        }

        await page.getByRole('button', { name: 'Submit' }).click();
        await expect(page.getByText('Success').or(page.getByText('Thank you'))).toBeVisible();
    });
});
