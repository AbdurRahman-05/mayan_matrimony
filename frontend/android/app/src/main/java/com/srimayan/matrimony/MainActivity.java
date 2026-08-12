package com.srimayan.matrimony;

import android.os.Bundle;
import androidx.appcompat.app.AppCompatActivity;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        // Switch to the runtime theme before super.onCreate so the
        // WebView renders on a white background (not black).
        setTheme(R.style.AppTheme_NoActionBar);
        super.onCreate(savedInstanceState);
    }
}
