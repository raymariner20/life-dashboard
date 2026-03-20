#!/usr/bin/env python3
"""
Mobile Dashboard Test Script
Validates mobile optimizations are in place
"""

import re
from pathlib import Path

def test_mobile_optimizations():
    """Test that mobile optimizations exist in the dashboard."""
    
    dashboard_path = Path("/Users/raymariner/.openclaw/workspace/life-dashboard/index.html")
    content = dashboard_path.read_text()
    
    tests = []
    
    # Test 1: Viewport meta tag
    tests.append((
        "Viewport meta tag",
        '<meta name="viewport" content="width=device-width, initial-scale=1.0">' in content
    ))
    
    # Test 2: Mobile media query exists
    tests.append((
        "Mobile media query (@media max-width: 768px)",
        "@media (max-width: 768px)" in content
    ))
    
    # Test 3: Mobile navigation exists
    tests.append((
        "Mobile navigation bar",
        'class="mobile-nav"' in content
    ))
    
    # Test 4: Mobile nav items exist
    tests.append((
        "Mobile nav items",
        'class="mobile-nav-item"' in content and content.count('mobile-nav-item') >= 6
    ))
    
    # Test 5: ShowTabMobile function exists
    tests.append((
        "Mobile tab switching function",
        "function showTabMobile" in content
    ))
    
    # Test 6: Touch-friendly CSS
    tests.append((
        "Touch-friendly styles (-webkit-tap-highlight)",
        "-webkit-tap-highlight-color" in content
    ))
    
    # Test 7: Responsive bento grid
    tests.append((
        "Responsive bento grid (mobile: 1fr)",
        "grid-template-columns: 1fr" in content and "@media (max-width: 768px)" in content
    ))
    
    # Test 8: Mobile padding adjustments
    tests.append((
        "Mobile padding adjustments",
        ".main { margin-left: 0; padding: var(--space-md);" in content
    ))
    
    # Test 9: Bottom padding for mobile nav
    tests.append((
        "Bottom padding for mobile nav",
        "padding-bottom: 100px" in content
    ))
    
    # Test 10: Sidebar hidden on mobile
    tests.append((
        "Sidebar hidden on mobile",
        ".sidebar { display: none; }" in content
    ))
    
    # Print results
    print("📱 Mobile Dashboard Test Results")
    print("=" * 50)
    
    passed = 0
    failed = 0
    
    for test_name, result in tests:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status}: {test_name}")
        if result:
            passed += 1
        else:
            failed += 1
    
    print("=" * 50)
    print(f"Total: {passed}/{len(tests)} tests passed")
    
    if failed == 0:
        print("\n🎉 All mobile optimizations are in place!")
        print("\nKey features:")
        print("  • Bottom navigation bar for easy tab switching")
        print("  • Responsive grid layouts")
        print("  • Touch-friendly tap targets")
        print("  • Optimized spacing for small screens")
        print("  • Hidden sidebar, visible mobile nav")
        return 0
    else:
        print(f"\n⚠️  {failed} test(s) failed. Review needed.")
        return 1


if __name__ == "__main__":
    exit(test_mobile_optimizations())