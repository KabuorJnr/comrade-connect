$apiKey = 'AIzaSyA1FJZC0NtFoIbcCIXVFuU1PPrr-d3FWR8'
$r = Invoke-RestMethod -Method Post -Uri "https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=$apiKey" -ContentType 'application/json' -Body '{"returnSecureToken":true}'
$token = $r.idToken
$base = "https://firestore.googleapis.com/v1/projects/comrade-connect-184cb/databases/(default)/documents"
function PostDoc($path,$obj) {
  $json = $obj | ConvertTo-Json -Depth 10
  $url = "$base/$path"
  Invoke-RestMethod -Method Post -Uri $url -Headers @{ Authorization = "Bearer $token" } -ContentType 'application/json' -Body $json
}
$now = (Get-Date).ToString('o')
$services = @(
  @{ fields = @{ title = @{ stringValue = 'Math Tutoring - 1hr' }; category = @{ stringValue = 'Academic' }; price = @{ stringValue = '400' }; location = @{ stringValue = 'Library, Block A' }; phone = @{ stringValue = '+254712345001' }; seller = @{ stringValue = 'Comrade Tutors' }; rating = @{ doubleValue = 4.9 }; createdAt = @{ timestampValue = $now } } }
  @{ fields = @{ title = @{ stringValue = 'Phone Repairs' }; category = @{ stringValue = 'Electronics' }; price = @{ stringValue = '600' }; location = @{ stringValue = 'Market St.' }; phone = @{ stringValue = '+254712345002' }; seller = @{ stringValue = 'FixIt Mobile' }; rating = @{ doubleValue = 4.5 }; createdAt = @{ timestampValue = $now } } }
  @{ fields = @{ title = @{ stringValue = 'Graphic Design - Flyers' }; category = @{ stringValue = 'Graphics' }; price = @{ stringValue = '250' }; location = @{ stringValue = 'Online' }; phone = @{ stringValue = '+254712345003' }; seller = @{ stringValue = 'DesignHub' }; rating = @{ doubleValue = 4.7 }; createdAt = @{ timestampValue = $now } } }
)
foreach ($s in $services) { PostDoc 'artifacts/comrade-connect-184cb/public/data/services' $s | Out-Null }
$posts = @(
  @{ fields = @{ type = @{ stringValue = 'Event' }; author = @{ stringValue = 'Student Union' }; time = @{ stringValue = '2 hrs ago' }; content = @{ stringValue = 'Orientation party this Friday at Main Quad.' }; likes = @{ integerValue = '34' }; createdAt = @{ timestampValue = $now } } }
  @{ fields = @{ type = @{ stringValue = 'Announcement' }; author = @{ stringValue = 'Admin' }; time = @{ stringValue = '1 day ago' }; content = @{ stringValue = 'Library hours extended during exams.' }; likes = @{ integerValue = '12' }; createdAt = @{ timestampValue = $now } } }
)
foreach ($p in $posts) { PostDoc 'artifacts/comrade-connect-184cb/public/data/community_posts' $p | Out-Null }
Write-Output 'SEED_DONE'
