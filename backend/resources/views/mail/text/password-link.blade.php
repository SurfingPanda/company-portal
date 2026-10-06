ELJIN CORPORATION - Employee Portal

@if ($purpose === 'activation')
Welcome! An Employee Portal account was created for you (employee ID {{ $employeeId }}).
Choose your password to activate it:
@else
We received a request to reset the password for employee ID {{ $employeeId }}.
Choose a new password:
@endif

{{ $url }}

The link works once and expires in {{ $hours }} hours. If you did not expect this email, ignore it: your password does not change.
