_ZN3cmp10functional17h15f2b92116f4e4e4E:
	.cfi_startproc
	testq	%rdi, %rdi
	je	.LBB0_1
	movl	$1, %ecx
	xorl	%edx, %edx
	xorl	%eax, %eax
	.p2align	4, 0x90
.LBB0_3:
	movl	%edx, %esi
	andl	$1, %esi
	negq	%rsi
	andq	%rdx, %rsi
	addq	%rsi, %rax
	movq	%rcx, %rdx
	imulq	%rcx, %rdx
	addq	$1, %rcx
	cmpq	%rdi, %rdx
	jb	.LBB0_3
	retq
.LBB0_1:
	xorl	%eax, %eax
	retq
.Lfunc_end0:
	.size	_ZN3cmp10functional17h15f2b92116f4e4e4E, .Lfunc_end0-_ZN3cmp10functional17h15f2b92116f4e4e4E
	.cfi_endproc