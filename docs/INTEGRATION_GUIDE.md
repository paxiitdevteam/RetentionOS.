# RetentionOS Integration Guide

## How SaaS Owners Use RetentionOS

RetentionOS uses a **hybrid integration model** that combines the simplicity of SaaS platforms (like Salesforce or Jira) with the flexibility of SDK integrations (like Stripe or Intercom).

### The Integration Model Explained

**Step 1: Sign Up & Create Account** (Like Salesforce/Jira)
- SaaS founders sign up for RetentionOS
- They create an account and choose a pricing plan
- They get access to the RetentionOS dashboard

**Step 2: Get Your API Key** (Like Stripe/Intercom)
- From the dashboard, they generate an API key
- This key authenticates their widget with RetentionOS backend
- One API key per account (can be rotated for security)

**Step 3: Integrate Widget SDK** (Like Stripe/Intercom)
- They add a simple JavaScript snippet to their platform
- The widget automatically detects cancel button clicks
- No complex backend integration required

**Step 4: Configure Retention Flows** (Like Salesforce/Jira)
- They use the RetentionOS dashboard to create retention flows
- Design steps: pause, downgrade, discount, support, feedback
- Set up different flows for different plans or regions

**Step 5: Monitor & Optimize** (Like Salesforce/Jira)
- View analytics in the dashboard
- See saved revenue, saved users, churn reasons
- Use AI suggestions to improve flows

---

## Complete Integration Process

### Phase 1: Account Setup (5 minutes)

1. **Sign Up**
   - Visit RetentionOS website
   - Click "Start Free" or "Get Started"
   - Create account with email and password
   - Choose pricing plan (Free, Growth, Pro, or Scale)

2. **Access Dashboard**
   - Log in to RetentionOS dashboard
   - Complete onboarding (if any)
   - Verify email (if required)

### Phase 2: Get API Key (2 minutes)

1. **Navigate to Settings**
   - Go to Settings page in dashboard
   - Click on "API Keys" section

2. **Generate API Key**
   - Click "Generate New API Key"
   - Copy the API key immediately (shown only once)
   - Store it securely (you'll need it for integration)

3. **API Key Format**
   ```
   ros_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   ```
   - Starts with `ros_live_` (production) or `ros_test_` (testing)
   - 32-character random string
   - Never expires (unless manually rotated)

### Phase 3: Widget Integration (10 minutes)

#### Option A: Simple Script Tag (Recommended)

Add this to your HTML page where users can cancel subscriptions:

```html
<!-- Add before closing </body> tag -->
<script src="https://cdn.retentionos.com/widget.js"></script>
<script>
  RetentionOS.init({
    apiKey: 'ros_live_your_api_key_here',
    userId: '{{current_user_id}}',  // Replace with your user ID
    plan: '{{user_plan}}',           // Replace with user's plan (e.g., 'pro', 'basic')
    region: '{{user_region}}'       // Replace with user's region (e.g., 'us', 'eu')
  });
</script>
```

#### Option B: NPM Package (For React/Vue/Angular)

```bash
npm install @retentionos/widget
```

```javascript
import RetentionOS from '@retentionos/widget';

RetentionOS.init({
  apiKey: process.env.RETENTIONOS_API_KEY,
  userId: currentUser.id,
  plan: currentUser.subscriptionPlan,
  region: currentUser.region
});
```

#### Option C: Custom Integration (Advanced)

If you need more control, you can use the API directly:

```javascript
// Detect cancel button click
document.getElementById('cancel-button').addEventListener('click', async (e) => {
  e.preventDefault();
  
  // Call RetentionOS API
  const response = await fetch('https://api.retentionos.com/retention/start', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': 'ros_live_your_api_key_here'
    },
    body: JSON.stringify({
      userId: currentUser.id,
      plan: currentUser.plan,
      region: currentUser.region
    })
  });
  
  const flow = await response.json();
  // Display flow steps in your own UI
});
```

### Phase 4: Configure Retention Flows (15 minutes)

1. **Create Your First Flow**
   - Go to "Flows" page in dashboard
   - Click "Create New Flow"
   - Give it a name (e.g., "Pro Plan Retention")

2. **Add Steps**
   - Click "Add Step"
   - Choose step type:
     - **Pause**: Pause subscription for X days
     - **Downgrade**: Offer to move to lower plan
     - **Discount**: Offer percentage or fixed discount
     - **Support**: Show support contact option
     - **Feedback**: Collect cancellation reason
   - Configure each step (text, duration, amounts)
   - Reorder steps by dragging

3. **Set Flow Rules**
   - Which plans should use this flow?
   - Which regions?
   - Active or inactive?

4. **Test Flow**
   - Use test mode to preview flow
   - Test with different user scenarios

### Phase 5: Connect Stripe (Optional - 5 minutes)

If you use Stripe for billing:

1. **Get Stripe API Keys**
   - From your Stripe dashboard
   - Copy your Secret Key

2. **Add to RetentionOS**
   - Go to Settings → Integrations
   - Enter Stripe Secret Key
   - Test connection

3. **Enable Webhooks**
   - RetentionOS will automatically update Stripe subscriptions
   - When users accept offers (pause, downgrade, discount)
   - Stripe webhooks update RetentionOS with subscription changes

---

## How It Works (Technical Flow)

### 1. User Clicks Cancel Button

```javascript
// User clicks "Cancel Subscription" button on your platform
<button id="cancel-subscription">Cancel Subscription</button>
```

### 2. Widget Detects Click

The RetentionOS widget automatically detects the click using:
- CSS selectors (`.cancel`, `#cancel`, `[data-action="cancel"]`)
- Data attributes (`data-cancel`, `data-action="cancel"`)
- Class names (`.cancel-button`, `.unsubscribe`)
- Event delegation (listens for clicks on cancel-related elements)

### 3. Widget Calls RetentionOS API

```javascript
POST https://api.retentionos.com/retention/start
Headers:
  X-API-Key: ros_live_your_api_key_here
Body:
  {
    "userId": "user-123",
    "plan": "pro",
    "region": "us"
  }
```

### 4. Backend Returns Flow

```json
{
  "flowId": 1,
  "steps": [
    {
      "type": "pause",
      "title": "Pause Your Subscription",
      "description": "Take a break for 30 days",
      "duration": 30
    },
    {
      "type": "downgrade",
      "title": "Downgrade to Basic",
      "description": "Save 50% with our Basic plan",
      "targetPlan": "basic"
    },
    {
      "type": "discount",
      "title": "Stay with 20% Off",
      "description": "Get 20% off for 3 months",
      "discount": 20,
      "duration": 3
    }
  ],
  "language": "en"
}
```

### 5. Widget Displays Modal

The widget shows a beautiful modal with:
- Step-by-step flow
- Clear call-to-action buttons
- Brand styling (matches your platform)
- Mobile-responsive design

### 6. User Makes Decision

User can:
- Accept an offer (pause, downgrade, discount)
- Decline and continue cancellation
- Contact support
- Provide feedback

### 7. Widget Sends Decision to API

```javascript
POST https://api.retentionos.com/retention/decision
Headers:
  X-API-Key: ros_live_your_api_key_here
Body:
  {
    "flowId": 1,
    "stepId": 1,
    "offerType": "pause",
    "accepted": true,
    "userId": "user-123"
  }
```

### 8. Backend Processes Decision

- If accepted: Updates Stripe subscription (if connected)
- Logs event for analytics
- Updates saved revenue metrics
- Records churn reason (if provided)

### 9. Analytics Update

All events are logged and visible in dashboard:
- Saved revenue
- Saved users
- Churn reasons
- Offer performance
- Time-based trends

---

## Integration Examples

### Example 1: Simple HTML/JavaScript Site

```html
<!DOCTYPE html>
<html>
<head>
  <title>My SaaS Platform</title>
</head>
<body>
  <h1>Subscription Settings</h1>
  <button id="cancel-subscription">Cancel Subscription</button>

  <!-- RetentionOS Widget -->
  <script src="https://cdn.retentionos.com/widget.js"></script>
  <script>
    RetentionOS.init({
      apiKey: 'ros_live_abc123...',
      userId: 'user_456',
      plan: 'pro',
      region: 'us'
    });
  </script>
</body>
</html>
```

### Example 2: React Application

```jsx
import { useEffect } from 'react';

function SubscriptionSettings({ user }) {
  useEffect(() => {
    // Load RetentionOS widget
    const script = document.createElement('script');
    script.src = 'https://cdn.retentionos.com/widget.js';
    script.onload = () => {
      window.RetentionOS.init({
        apiKey: process.env.REACT_APP_RETENTIONOS_API_KEY,
        userId: user.id,
        plan: user.subscriptionPlan,
        region: user.region
      });
    };
    document.body.appendChild(script);
  }, [user]);

  return (
    <div>
      <h1>Subscription Settings</h1>
      <button id="cancel-subscription">Cancel Subscription</button>
    </div>
  );
}
```

### Example 3: Next.js Application

```jsx
// pages/subscription.tsx
import { useEffect } from 'react';
import Head from 'next/head';

export default function SubscriptionPage() {
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Load RetentionOS widget
      const script = document.createElement('script');
      script.src = 'https://cdn.retentionos.com/widget.js';
      script.onload = () => {
        window.RetentionOS.init({
          apiKey: process.env.NEXT_PUBLIC_RETENTIONOS_API_KEY,
          userId: getCurrentUserId(), // Your function
          plan: getCurrentUserPlan(),  // Your function
          region: getCurrentUserRegion() // Your function
        });
      };
      document.body.appendChild(script);
    }
  }, []);

  return (
    <>
      <Head>
        <title>Subscription Settings</title>
      </Head>
      <div>
        <h1>Subscription Settings</h1>
        <button id="cancel-subscription">Cancel Subscription</button>
      </div>
    </>
  );
}
```

### Example 4: WordPress Plugin

```php
<?php
// Add to functions.php or custom plugin

function retentionos_integration() {
    $api_key = get_option('retentionos_api_key');
    $user_id = get_current_user_id();
    $plan = get_user_meta($user_id, 'subscription_plan', true);
    $region = get_user_meta($user_id, 'region', true);
    
    ?>
    <script src="https://cdn.retentionos.com/widget.js"></script>
    <script>
        RetentionOS.init({
            apiKey: '<?php echo esc_js($api_key); ?>',
            userId: '<?php echo esc_js($user_id); ?>',
            plan: '<?php echo esc_js($plan); ?>',
            region: '<?php echo esc_js($region); ?>'
        });
    </script>
    <?php
}
add_action('wp_footer', 'retentionos_integration');
?>
```

---

## Configuration Options

### Widget Configuration

```javascript
RetentionOS.init({
  // Required
  apiKey: 'ros_live_...',        // Your API key from dashboard
  userId: 'user-123',              // Current user's ID in your system
  
  // Optional
  plan: 'pro',                     // User's subscription plan
  region: 'us',                     // User's region code
  apiUrl: 'https://api.retentionos.com', // API base URL (default: production)
  timeout: 5000,                   // API request timeout (ms)
  maxRetries: 3,                   // Max retry attempts on failure
  
  // Advanced
  customSelectors: [               // Custom cancel button selectors
    '.my-cancel-btn',
    '#unsubscribe-button'
  ],
  onFlowStart: (flow) => {         // Callback when flow starts
    console.log('Flow started:', flow);
  },
  onFlowComplete: (result) => {   // Callback when flow completes
    console.log('Flow completed:', result);
  }
});
```

### Cancel Button Detection

The widget automatically detects cancel buttons using:

1. **CSS Selectors**
   - `.cancel`, `.cancel-button`, `.unsubscribe`
   - `#cancel`, `#cancel-subscription`
   - `[data-action="cancel"]`, `[data-cancel]`

2. **Text Matching**
   - Buttons containing: "cancel", "unsubscribe", "end subscription"

3. **Custom Selectors**
   - You can specify custom selectors in config

---

## Security & Best Practices

### API Key Security

1. **Never expose API keys in client-side code** (if possible)
   - Use environment variables
   - Use server-side rendering to inject keys
   - Consider using a proxy endpoint

2. **Rotate keys regularly**
   - Go to Settings → API Keys
   - Click "Rotate Key"
   - Update integration with new key

3. **Use test keys for development**
   - Test keys start with `ros_test_`
   - Don't affect production analytics
   - Perfect for staging environments

### Rate Limiting

- API has rate limits to prevent abuse
- Free tier: 100 requests/minute
- Growth tier: 500 requests/minute
- Pro tier: 2000 requests/minute
- Scale tier: Unlimited

### Data Privacy

- User IDs are hashed before storage
- No PII (Personally Identifiable Information) is stored
- GDPR compliant
- Data retention: 2 years (configurable)

---

## Troubleshooting

### Widget Not Loading

1. **Check script tag**
   - Ensure script is loaded before `RetentionOS.init()`
   - Check browser console for errors

2. **Check API key**
   - Verify API key is correct
   - Ensure key is active (not expired/rotated)

3. **Check network**
   - Ensure `cdn.retentionos.com` is accessible
   - Check for CORS issues

### Cancel Buttons Not Detected

1. **Add custom selectors**
   ```javascript
   RetentionOS.init({
     // ... other config
     customSelectors: ['.my-cancel-button', '#cancel-btn']
   });
   ```

2. **Check button attributes**
   - Ensure buttons have proper IDs/classes
   - Use data attributes: `data-action="cancel"`

### Flows Not Showing

1. **Check flow configuration**
   - Ensure flow is active in dashboard
   - Verify flow matches user's plan/region

2. **Check API response**
   - Open browser DevTools → Network tab
   - Look for `/retention/start` request
   - Check response for errors

---

## Support & Resources

- **Documentation**: https://docs.retentionos.com
- **API Reference**: https://docs.retentionos.com/api
- **Support**: support@retentionos.com
- **Status Page**: https://status.retentionos.com

---

## Summary: How It Works

**RetentionOS is NOT like Salesforce or Jira** where you just sign up and use a web app. Instead, it's a **hybrid model**:

1. **Sign Up** (like Salesforce/Jira) → Create account, get dashboard access
2. **Get API Key** (like Stripe/Intercom) → Generate key from dashboard
3. **Integrate Widget** (like Stripe/Intercom) → Add script to your platform
4. **Configure Flows** (like Salesforce/Jira) → Use dashboard to design flows
5. **Monitor Results** (like Salesforce/Jira) → View analytics in dashboard

**The widget runs on YOUR platform** (not RetentionOS website), but **the dashboard and flows are managed on RetentionOS** (like Salesforce/Jira).

This gives you:
- ✅ Full control over user experience (widget on your site)
- ✅ Easy management (dashboard on RetentionOS)
- ✅ No complex backend integration (just a script tag)
- ✅ Powerful analytics (all in one dashboard)

---

*Last updated: January 2025*

